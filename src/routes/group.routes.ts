import { Router } from "express";
import { getGroupId } from "../controllers/group.controller";

const router = Router();

router.get("/get-group-id", getGroupId);

export default router;
