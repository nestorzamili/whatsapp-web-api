import { Client, LocalAuth } from "whatsapp-web.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";
import fs from "fs/promises";
import path from "path";
import { ClientData, ClientStatus } from "../interfaces/whatsapp.interface";
import qrcode from "qrcode-terminal";
import { puppeteerConfig } from "../config/puppeteer.config";

export class WhatsAppService {
  private clients: Map<string, ClientData> = new Map();
  private readonly SESSION_PATH = "./sessions";
  private readonly IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.startIdleCheck();
  }

  private createClient(clientId: string): Client {
    return new Client({
      authTimeoutMs: 20000,
      takeoverOnConflict: true,
      restartOnAuthFail: true,
      authStrategy: new LocalAuth({
        clientId,
        dataPath: path.join(this.SESSION_PATH, clientId),
      }),
      puppeteer: puppeteerConfig,
    });
  }

  private startIdleCheck() {
    setInterval(() => {
      this.clients.forEach((data, clientId) => {
        const idleTime = Date.now() - data.lastActive.getTime();
        if (
          idleTime >= this.IDLE_TIMEOUT &&
          data.status === ClientStatus.CONNECTED
        ) {
          this.idleClient(clientId).catch(logger.error);
        }
      });
    }, 60000);
  }

  private async safeDestroy(clientId: string): Promise<void> {
    const clientData = this.clients.get(clientId);
    if (!clientData) return;

    try {
      await clientData.client.destroy();
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const sessionPath = path.join(this.SESSION_PATH, clientId);
      await fs.rmdir(sessionPath, { recursive: true });
    } catch (error) {
      logger.error(`Error in safeDestroy for client ${clientId}:`, error);
      throw error;
    }
  }

  async initializeClient(): Promise<{ clientId: string; qr?: string }> {
    const clientId = uuidv4();
    const client = this.createClient(clientId);

    const clientData: ClientData = {
      client,
      status: ClientStatus.INITIALIZING,
      lastActive: new Date(),
    };

    this.clients.set(clientId, clientData);

    return new Promise((resolve, reject) => {
      client.on("qr", (qr) => {
        clientData.qr = qr;
        clientData.status = ClientStatus.INITIALIZING;
        qrcode.generate(qr, { small: true });
        logger.info(`QR Code generated for client: ${clientId}`);
        resolve({ clientId, qr });
      });

      client.on("ready", () => {
        clientData.status = ClientStatus.CONNECTED;
        clientData.lastActive = new Date();
        delete clientData.qr;
        logger.info(`Client ${clientId} is ready`);
      });

      client.on("auth_failure", (error) => {
        clientData.status = ClientStatus.ERROR;
        clientData.error = error;
        logger.error(`Client ${clientId} authentication failure:`, error);
        reject(error);
      });

      client.on("loading_screen", (percent, message) => {
        logger.info(`Client ${clientId} loading: ${percent}% - ${message}`);
      });

      client.on("disconnected", async (reason) => {
        clientData.status = ClientStatus.DISCONNECTED;
        clientData.error = reason;
        logger.warn(`Client ${clientId} disconnected:`, reason);

        try {
          await this.safeDestroy(clientId);
          logger.info(`Client ${clientId} cleaned up after disconnect`);
        } catch (error) {
          logger.error(
            `Error handling disconnect for client ${clientId}:`,
            error
          );
        }
      });

      client.initialize().catch(reject);
    });
  }

  async reconnectClient(clientId: string): Promise<boolean> {
    const sessionPath = path.join(this.SESSION_PATH, clientId);
    const sessionExists = await fs
      .access(sessionPath)
      .then(() => true)
      .catch(() => false);

    if (!sessionExists) {
      logger.warn(`Session not found for client ${clientId}`);
      return false;
    }

    const clientData = this.clients.get(clientId);
    if (clientData) {
      logger.info(`Client ${clientId} is already connected`);
      return false;
    }

    const client = this.createClient(clientId);
    const newClientData: ClientData = {
      client,
      status: ClientStatus.INITIALIZING,
      lastActive: new Date(),
    };

    this.clients.set(clientId, newClientData);

    try {
      await client.initialize();
      logger.info(`Client ${clientId} successfully reconnected`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize client ${clientId}:`, error);
      this.clients.delete(clientId);
      throw error;
    }
  }

  async idleClient(clientId: string): Promise<void> {
    const clientData = this.clients.get(clientId);
    if (clientData) {
      clientData.status = ClientStatus.IDLE;
      await clientData.client.destroy();
      this.clients.delete(clientId);
    }
  }

  async logoutClient(clientId: string): Promise<void> {
    const clientData = this.clients.get(clientId);
    if (clientData) {
      try {
        await clientData.client.logout().catch((err) => {
          logger.warn(
            `Logout failed for client ${clientId}, proceeding with destroy:`,
            err
          );
        });

        await this.safeDestroy(clientId);
        this.clients.delete(clientId);
        logger.info(
          `Client ${clientId} logged out and cleaned up successfully`
        );
      } catch (error) {
        logger.error(`Error during logout for client ${clientId}:`, error);
        this.clients.delete(clientId);
        throw error;
      }
    }
  }

  getClientStatus(clientId: string) {
    const clientData = this.clients.get(clientId);
    return clientData
      ? {
          clientId,
          status: clientData.status,
          lastActive: clientData.lastActive,
          qr: clientData.qr,
        }
      : null;
  }

  updateClientActivity(clientId: string) {
    const clientData = this.clients.get(clientId);
    if (clientData) {
      clientData.lastActive = new Date();
    }
  }

  getClient(clientId: string) {
    const clientData = this.clients.get(clientId);
    if (!clientData) {
      throw new Error("Client not found");
    }
    return clientData.client;
  }
}

export const whatsappService = new WhatsAppService();
