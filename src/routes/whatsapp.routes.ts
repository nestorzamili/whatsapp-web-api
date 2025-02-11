import { Router } from "express";
import { whatsappService } from "../services/whatsapp.service";
import logger from "../config/logger";

const router = Router();

router.post("/initialize", async (req, res) => {
  try {
    const result = await whatsappService.initializeClient();
    if (result.qr) {
      res.json({
        clientId: result.clientId,
        status: "INITIALIZING",
        qr: result.qr,
      });
    } else {
      res.json({
        clientId: result.clientId,
        status: "CONNECTING",
      });
    }
  } catch (error) {
    logger.error("Error initializing client:", error);
    res.status(500).json({ error: "Failed to initialize WhatsApp client" });
  }
});

router.post("/reconnect/:clientId", async (req, res) => {
  try {
    const success = await whatsappService.reconnectClient(req.params.clientId);
    res.json({ success });
  } catch (error) {
    logger.error("Error reconnecting client:", error);
    res.status(500).json({ error: "Failed to reconnect WhatsApp client" });
  }
});

router.post("/logout/:clientId", async (req, res) => {
  try {
    await whatsappService.logoutClient(req.params.clientId);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error logging out client:", error);
    res.status(500).json({ error: "Failed to logout WhatsApp client" });
  }
});

router.get("/status/:clientId", (req, res) => {
  const status = whatsappService.getClientStatus(req.params.clientId);
  if (!status) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(status);
});

export default router;
