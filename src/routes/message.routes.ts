import { Router } from "express";
import {
  sendTextMessage,
  sendImageMessage,
  sendBulkMessages,
  checkNumbers,
} from "../controllers/message.controller";
import { validateBulkMessageRequest } from "../middlewares/message.middleware";

const router = Router();

router.post("/text", sendTextMessage);
router.post("/image", sendImageMessage);
router.post("/bulk", validateBulkMessageRequest, sendBulkMessages);
router.post("/check-numbers", checkNumbers);

export default router;
