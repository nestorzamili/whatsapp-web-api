import { Request, Response } from "express";
import { MessageMedia } from "whatsapp-web.js";
import { whatsappService } from "../services/whatsapp.service";
import logger from "../config/logger";

export const sendTextMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { number, message, clientId } = req.body;

    if (!number || !message || !clientId) {
      res
        .status(400)
        .json({ message: "Number, message, and clientId are required" });
      return;
    }

    const clientData = whatsappService.getClientStatus(clientId);
    if (!clientData) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const formattedNumber = number.includes("@c.us")
      ? number
      : `${number}@c.us`;
    const client = whatsappService.getClient(clientId);
    await client.sendMessage(formattedNumber, message);

    whatsappService.updateClientActivity(clientId);
    logger.info(
      `Message sent to ${number} from client ${clientId}: ${message}`
    );
    res.json({ message: "Text message sent successfully" });
  } catch (error) {
    logger.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message", error });
  }
};

export const sendImageMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { number, imageUrl, caption, clientId } = req.body;

    if (!number || !imageUrl || !clientId) {
      res
        .status(400)
        .json({ message: "Number, image URL, and clientId are required" });
      return;
    }

    const clientData = whatsappService.getClientStatus(clientId);
    if (!clientData) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const formattedNumber = number.includes("@c.us")
      ? number
      : `${number}@c.us`;
    const media = await MessageMedia.fromUrl(imageUrl);
    const client = whatsappService.getClient(clientId);
    await client.sendMessage(formattedNumber, media, { caption });

    whatsappService.updateClientActivity(clientId);
    logger.info(`Image sent to ${number} from client ${clientId}: ${imageUrl}`);
    res.json({ message: "Image message sent successfully" });
  } catch (error) {
    logger.error("Error sending image message:", error);
    res.status(500).json({ message: "Failed to send image message", error });
  }
};
