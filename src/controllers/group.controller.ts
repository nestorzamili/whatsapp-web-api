import { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service";
import logger from "../config/logger";

export const getGroupId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupName, clientId } = req.body;

    if (!groupName || !clientId) {
      res.status(400).json({ message: "Group name and clientId are required" });
      return;
    }

    const clientData = whatsappService.getClientStatus(clientId);
    if (!clientData) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const client = whatsappService.getClient(clientId);
    const chats = await client.getChats();
    const group = chats.find((chat) => chat.isGroup && chat.name === groupName);

    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    whatsappService.updateClientActivity(clientId);
    logger.info(
      `Group ID for ${groupName} fetched by client ${clientId}: ${group.id._serialized}`
    );
    res.json({ groupId: group.id._serialized });
  } catch (error) {
    logger.error("Error fetching group ID:", error);
    res.status(500).json({ message: "Failed to fetch group ID", error });
  }
};
