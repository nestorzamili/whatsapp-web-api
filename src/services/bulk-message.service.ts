import { MessageMedia } from "whatsapp-web.js";
import { whatsappService } from "./whatsapp.service";
import logger from "../config/logger";
import { BatchProcessResult } from "../interfaces/message.interface";
import { NumberChecker } from "./helpers/number-checker";
import { rateLimiter } from "./helpers/rate-limiter";

export class BulkMessageService {
  private readonly BATCH_SIZE = 20;
  private readonly DELAY_BETWEEN_MESSAGES = 1000; // 1 second
  private readonly DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private formatNumber(number: string): string {
    return number.includes("@c.us") ? number : `${number}@c.us`;
  }

  private async sendWithRateLimit(
    client: any,
    number: string,
    message: string | MessageMedia,
    options?: any
  ): Promise<void> {
    const clientId = client.options.authStrategy.clientId;
    await rateLimiter.waitForAvailableSlot(clientId);

    await client.sendMessage(number, message, options);
    await rateLimiter.incrementCounter(clientId);
  }

  private async processBatch(
    numbers: string[],
    message: string,
    clientId: string,
    imageUrl?: string,
    caption?: string
  ): Promise<BatchProcessResult> {
    const result: BatchProcessResult = { success: [], failed: [], invalid: [] };
    const client = whatsappService.getClient(clientId);

    // Check valid numbers first
    const { valid, invalid } = await NumberChecker.checkNumbers(
      client,
      numbers
    );
    result.invalid.push(...invalid);

    for (const number of valid) {
      try {
        const formattedNumber = NumberChecker.formatNumber(number);

        if (imageUrl) {
          const media = await MessageMedia.fromUrl(imageUrl);
          await this.sendWithRateLimit(client, formattedNumber, media, {
            caption,
          });
        } else {
          await this.sendWithRateLimit(client, formattedNumber, message);
        }

        result.success.push(number);
        await this.delay(this.DELAY_BETWEEN_MESSAGES);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message === "Rate limit timeout exceeded"
        ) {
          logger.warn(`Rate limit exceeded for batch, pausing for recovery...`);
          await this.delay(this.DELAY_BETWEEN_BATCHES * 2); // Extended delay for rate limit recovery
          result.failed.push({
            number,
            error: "Rate limit exceeded, message will be retried later",
          });
        } else {
          result.failed.push({
            number,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          logger.error(`Failed to send message to ${number}:`, error);
        }
      }
    }

    return result;
  }

  async sendBulkMessages(
    numbers: string[],
    message: string,
    clientId: string,
    imageUrl?: string,
    caption?: string
  ): Promise<BatchProcessResult> {
    const result: BatchProcessResult = { success: [], failed: [], invalid: [] };

    // Split numbers into batches
    for (let i = 0; i < numbers.length; i += this.BATCH_SIZE) {
      const batch = numbers.slice(i, i + this.BATCH_SIZE);
      const batchResult = await this.processBatch(
        batch,
        message,
        clientId,
        imageUrl,
        caption
      );

      result.success.push(...batchResult.success);
      result.failed.push(...batchResult.failed);

      whatsappService.updateClientActivity(clientId);

      if (i + this.BATCH_SIZE < numbers.length) {
        await this.delay(this.DELAY_BETWEEN_BATCHES);
      }
    }

    return result;
  }
}

export const bulkMessageService = new BulkMessageService();
