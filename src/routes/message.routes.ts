import { Router } from "express";
import {
  sendTextMessage,
  sendImageMessage,
} from "../controllers/message.controller";

const router = Router();

router.post("/text", sendTextMessage);
router.post("/image", sendImageMessage);

export default router;
