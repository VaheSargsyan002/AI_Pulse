import { Router } from "express";
import * as controller from "../controllers/chat.controller";

const router = Router();

router.get("/session", controller.getChatSession);
router.post("/", controller.chatWithDocument);
router.post("/general", controller.chatGeneral);

export default router;
