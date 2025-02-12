import { Client, LocalAuth } from "whatsapp-web.js";
import path from "path";
import { ClientData, ClientStatus } from "../../interfaces/whatsapp.interface";
import { WHATSAPP_CONFIG } from "../../config/whatsapp.config";
import { puppeteerConfig } from "../../config/puppeteer.config";

export class ClientManager {
  private clients: Map<string, ClientData> = new Map();

  createClient(clientId: string): Client {
    return new Client({
      authTimeoutMs: WHATSAPP_CONFIG.AUTH_TIMEOUT,
      takeoverOnConflict: true,
      restartOnAuthFail: true,
      authStrategy: new LocalAuth({
        clientId,
        dataPath: path.join(WHATSAPP_CONFIG.SESSION_PATH, clientId),
      }),
      puppeteer: puppeteerConfig,
    });
  }

  setClient(clientId: string, clientData: ClientData): void {
    this.clients.set(clientId, clientData);
  }

  getClient(clientId: string): Client {
    const data = this.clients.get(clientId);
    if (!data) throw new Error("Client not found");
    return data.client;
  }

  getClientData(clientId: string): ClientData | undefined {
    return this.clients.get(clientId);
  }

  deleteClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  getAllClients(): Map<string, ClientData> {
    return this.clients;
  }

  updateClientActivity(clientId: string): void {
    const data = this.clients.get(clientId);
    if (data) data.lastActive = new Date();
  }

  getClientStatus(clientId: string) {
    const data = this.clients.get(clientId);
    return data
      ? {
          clientId,
          status: data.status,
          lastActive: data.lastActive,
          qr: data.qr,
        }
      : null;
  }
}
