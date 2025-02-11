import { Client } from "whatsapp-web.js";

export enum ClientStatus {
  INITIALIZING = "INITIALIZING",
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  IDLE = "IDLE",
  ERROR = "ERROR",
}

export interface ClientData {
  client: Client;
  status: ClientStatus;
  lastActive: Date;
  qr?: string;
  error?: string;
}

export interface ClientSession {
  clientId: string;
  status: ClientStatus;
  lastActive: Date;
}
