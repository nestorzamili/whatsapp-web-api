import { WHATSAPP_CONFIG } from "../../config/whatsapp.config";
import logger from "../../config/logger";

interface RateWindow {
  count: number;
  timestamp: number;
}

export class RateLimiter {
  private clientWindows: Map<string, RateWindow[]> = new Map();
  private readonly windowMs = WHATSAPP_CONFIG.RATE_LIMIT.WINDOW_MS;

  private cleanup(clientId: string) {
    const now = Date.now();
    const windows = this.clientWindows.get(clientId) || [];
    const validWindows = windows.filter(
      (window) => now - window.timestamp < this.windowMs
    );
    this.clientWindows.set(clientId, validWindows);
  }

  private getCurrentCount(clientId: string): number {
    this.cleanup(clientId);
    const windows = this.clientWindows.get(clientId) || [];
    return windows.reduce((sum, window) => sum + window.count, 0);
  }

  async checkRateLimit(clientId: string): Promise<boolean> {
    const currentCount = this.getCurrentCount(clientId);
    const maxMessages = WHATSAPP_CONFIG.RATE_LIMIT.MAX_MESSAGES_PER_MINUTE;

    if (currentCount >= maxMessages) {
      logger.warn(`Rate limit exceeded for client ${clientId}`);
      return false;
    }

    return true;
  }

  async incrementCounter(clientId: string): Promise<void> {
    const windows = this.clientWindows.get(clientId) || [];
    const now = Date.now();

    if (
      windows.length === 0 ||
      now - windows[windows.length - 1].timestamp >= this.windowMs
    ) {
      windows.push({ count: 1, timestamp: now });
    } else {
      windows[windows.length - 1].count++;
    }

    this.clientWindows.set(clientId, windows);
  }

  async waitForAvailableSlot(clientId: string): Promise<void> {
    const checkInterval = 1000; // Check every second
    const maxWaitTime = this.windowMs; // Maximum wait time is one window
    let waitedTime = 0;

    while (waitedTime < maxWaitTime) {
      if (await this.checkRateLimit(clientId)) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }

    throw new Error("Rate limit timeout exceeded");
  }
}

export const rateLimiter = new RateLimiter();
