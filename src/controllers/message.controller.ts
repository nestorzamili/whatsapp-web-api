import { Request, Response } from "express";
import { MessageMedia } from "whatsapp-web.js";
import { whatsappService } from "../services/whatsapp.service";
import logger from "../config/logger";
import { bulkMessageService } from "../services/bulk-message.service";
import { NumberChecker } from "../services/helpers/number-checker";

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

export const sendBulkMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { numbers, message, clientId, imageUrl, caption } = req.body;

    const clientData = whatsappService.getClientStatus(clientId);
    if (!clientData) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const result = await bulkMessageService.sendBulkMessages(
      numbers,
      message,
      clientId,
      imageUrl,
      caption
    );

    logger.info(
      `Bulk message processing completed for client ${clientId}. ` +
        `Success: ${result.success.length}, Failed: ${result.failed.length}`
    );

    res.json({
      message: "Bulk message processing completed",
      result,
    });
  } catch (error) {
    logger.error("Error processing bulk messages:", error);
    res.status(500).json({
      message: "Failed to process bulk messages",
      error,
    });
  }
};

export const checkNumbers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { numbers, clientId } = req.body;

    if (!numbers || !clientId || !Array.isArray(numbers)) {
      res.status(400).json({
        message: "Numbers array and clientId are required",
      });
      return;
    }

    const clientData = whatsappService.getClientStatus(clientId);
    if (!clientData) {
      res.status(404).json({ message: "Client not found" });
      return;
    }

    const client = whatsappService.getClient(clientId);
    const result = await NumberChecker.checkNumbers(client, numbers);

    whatsappService.updateClientActivity(clientId);
    res.json({
      message: "Number check completed",
      result,
    });
  } catch (error) {
    logger.error("Error checking numbers:", error);
    res.status(500).json({
      message: "Failed to check numbers",
      error,
    });
  }
};
