import { Client } from "whatsapp-web.js";
import { ClientData, ClientStatus } from "../../interfaces/whatsapp.interface";
import logger from "../../config/logger";
import qrcode from "qrcode-terminal";

export class EventHandler {
  constructor(
    private reconnectClient: (clientId: string) => Promise<boolean>
  ) {}

  setupClientEvents(
    client: Client,
    clientId: string,
    clientData: ClientData,
    cleanupClient: (clientId: string, reason?: string) => Promise<void>
  ): Promise<{ clientId: string; qr?: string }> {
    return new Promise((resolve, reject) => {
      const events = {
        qr: (qr: string) => {
          clientData.qr = qr;
          clientData.status = ClientStatus.INITIALIZING;
          qrcode.generate(qr, { small: true });
          logger.info(`QR Code generated for client: ${clientId}`);
          resolve({ clientId, qr });
        },
        ready: () => {
          clientData.status = ClientStatus.CONNECTED;
          clientData.lastActive = new Date();
          delete clientData.qr;
          logger.info(`Client ${clientId} is ready`);
        },
        disconnected: async (reason: string) => {
          clientData.status = ClientStatus.DISCONNECTED;
          logger.warn(`Client ${clientId} disconnected:`, reason);

          const shouldCleanup = ["UNPAIRED", "LOGOUT"].includes(reason);
          await cleanupClient(clientId, reason);

          if (!shouldCleanup) {
            await this.reconnectClient(clientId).catch(() => {});
          }
        },
        auth_failure: (error: Error) => {
          clientData.status = ClientStatus.ERROR;
          clientData.error = error.message;
          logger.error(`Client ${clientId} authentication failure:`, error);
          reject(error);
        },
      };

      Object.entries(events).forEach(([event, handler]) => {
        client.on(event, handler);
      });

      client.initialize().catch(reject);
    });
  }
}
