import { Router } from "express";
import messageRoutes from "./message.routes";
import groupRoutes from "./group.routes";
import whatsAppRoutes from "./whatsapp.routes";

const router = Router();

router.use("/messages", messageRoutes);
router.use("/groups", groupRoutes);
router.use("/whatsapp", whatsAppRoutes);

export default router;
