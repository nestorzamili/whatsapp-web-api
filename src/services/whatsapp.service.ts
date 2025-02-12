import { Client } from "whatsapp-web.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";
import fs from "fs/promises";
import path from "path";
import { ClientData, ClientStatus } from "../interfaces/whatsapp.interface";
import { WHATSAPP_CONFIG } from "../config/whatsapp.config";
import { ClientManager } from "./managers/client-manager";
import { EventHandler } from "./managers/event-handler";
import { CleanupManager } from "./managers/cleanup-manager";

export class WhatsAppService {
  private clientManager: ClientManager;
  private eventHandler: EventHandler;
  private cleanupManager: CleanupManager;

  constructor() {
    this.clientManager = new ClientManager();
    this.eventHandler = new EventHandler(this.reconnectClient.bind(this));
    this.cleanupManager = new CleanupManager(this.clientManager);

    this.startIdleCheck();
    this.setupErrorHandlers();
  }

  private startIdleCheck() {
    setInterval(() => {
      this.clientManager.getAllClients().forEach((data, clientId) => {
        const idleTime = Date.now() - data.lastActive.getTime();
        if (
          idleTime >= WHATSAPP_CONFIG.IDLE_TIMEOUT &&
          data.status === ClientStatus.CONNECTED
        ) {
          this.idleClient(clientId).catch(logger.error);
        }
      });
    }, WHATSAPP_CONFIG.IDLE_CHECK_INTERVAL);
  }

  private setupErrorHandlers() {
    const handleError = async (error: Error | string) => {
      const errorMsg = error instanceof Error ? error.message : error;
      if (
        errorMsg.includes("Protocol Error:") ||
        errorMsg.includes("Target closed.")
      ) {
        logger.error("Critical error detected:", errorMsg);
        await this.cleanupManager.cleanupAllClients();
      }
    };

    process.on("unhandledRejection", handleError);
    process.on("uncaughtException", handleError);
  }

  async initializeClient(): Promise<{ clientId: string; qr?: string }> {
    const clientId = uuidv4();
    const client = this.clientManager.createClient(clientId);
    const clientData: ClientData = {
      client,
      status: ClientStatus.INITIALIZING,
      lastActive: new Date(),
    };

    this.clientManager.setClient(clientId, clientData);
    return this.eventHandler.setupClientEvents(
      client,
      clientId,
      clientData,
      this.cleanupManager.cleanupClient.bind(this.cleanupManager)
    );
  }

  async reconnectClient(clientId: string): Promise<boolean> {
    const sessionPath = path.join(WHATSAPP_CONFIG.SESSION_PATH, clientId);
    const sessionExists = await fs
      .access(sessionPath)
      .then(() => true)
      .catch(() => false);

    if (!sessionExists) {
      logger.warn(`Session not found for client ${clientId}`);
      return false;
    }

    if (this.clientManager.getClientData(clientId)) {
      logger.info(`Client ${clientId} is already connected`);
      return false;
    }

    const client = this.clientManager.createClient(clientId);
    const newClientData: ClientData = {
      client,
      status: ClientStatus.INITIALIZING,
      lastActive: new Date(),
    };

    this.clientManager.setClient(clientId, newClientData);

    try {
      await client.initialize();
      logger.info(`Client ${clientId} successfully reconnected`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize client ${clientId}:`, error);
      this.clientManager.deleteClient(clientId);
      throw error;
    }
  }

  // Public methods
  async idleClient(clientId: string): Promise<void> {
    const clientData = this.clientManager.getClientData(clientId);
    if (clientData) {
      clientData.status = ClientStatus.IDLE;
      await clientData.client.destroy();
      this.clientManager.deleteClient(clientId);
    }
  }

  async logoutClient(clientId: string): Promise<void> {
    const clientData = this.clientManager.getClientData(clientId);
    if (clientData) {
      try {
        await clientData.client.logout().catch((err) => {
          logger.warn(
            `Logout failed for client ${clientId}, proceeding with destroy:`,
            err
          );
        });
        await this.cleanupManager.cleanupClient(clientId);
        logger.info(
          `Client ${clientId} logged out and cleaned up successfully`
        );
      } catch (error) {
        logger.error(`Error during logout for client ${clientId}:`, error);
        this.clientManager.deleteClient(clientId);
        throw error;
      }
    }
  }

  getClientStatus(clientId: string) {
    return this.clientManager.getClientStatus(clientId);
  }

  updateClientActivity(clientId: string) {
    this.clientManager.updateClientActivity(clientId);
  }

  getClient(clientId: string): Client {
    return this.clientManager.getClient(clientId);
  }
}

export const whatsappService = new WhatsAppService();
