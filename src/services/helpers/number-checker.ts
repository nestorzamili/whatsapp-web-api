import { Client } from "whatsapp-web.js";
import logger from "../../config/logger";

export class NumberChecker {
  static formatNumber(number: string): string {
    return number.includes("@c.us") ? number : `${number}@c.us`;
  }

  static async isRegistered(client: Client, number: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatNumber(number);
      const isRegistered = await client.isRegisteredUser(formattedNumber);
      return isRegistered;
    } catch (error) {
      logger.error(`Error checking number ${number}:`, error);
      return false;
    }
  }

  static async checkNumbers(
    client: Client,
    numbers: string[]
  ): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    const results = await Promise.all(
      numbers.map(async (number) => ({
        number,
        isValid: await this.isRegistered(client, number),
      }))
    );

    return results.reduce(
      (acc, { number, isValid }) => {
        if (isValid) {
          acc.valid.push(number);
        } else {
          acc.invalid.push(number);
        }
        return acc;
      },
      { valid: [] as string[], invalid: [] as string[] }
    );
  }
}
