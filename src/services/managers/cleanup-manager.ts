import fs from "fs/promises";
import path from "path";
import logger from "../../config/logger";
import { WHATSAPP_CONFIG } from "../../config/whatsapp.config";
import { ClientManager } from "./client-manager";

export class CleanupManager {
  constructor(private clientManager: ClientManager) {}

  async cleanupClient(clientId: string, reason?: string): Promise<void> {
    const clientData = this.clientManager.getClientData(clientId);
    if (!clientData) return;

    try {
      await clientData.client.destroy();
      const sessionPath = path.join(WHATSAPP_CONFIG.SESSION_PATH, clientId);
      await fs
        .rm(sessionPath, { recursive: true, force: true })
        .catch(() => {});
      this.clientManager.deleteClient(clientId);
      logger.info(
        `Client ${clientId} cleaned up${reason ? ` (${reason})` : ""}`
      );
    } catch (error) {
      logger.error(`Cleanup failed for client ${clientId}:`, error);
      this.clientManager.deleteClient(clientId);
    }
  }

  async cleanupAllClients(): Promise<void> {
    const cleanupPromises = Array.from(
      this.clientManager.getAllClients().keys()
    ).map((clientId) => this.cleanupClient(clientId, "emergency cleanup"));
    await Promise.allSettled(cleanupPromises);
  }
}
