import { Router } from "express";
import { chatLimiter } from "../middleware/upload";
import * as controller from "../controllers/chat.controller";

const router = Router();

router.get("/session", controller.getChatSession);
router.get("/general/session", controller.getGeneralChatSession);
router.post("/", chatLimiter, controller.chatWithDocument);
router.post("/general", chatLimiter, controller.chatGeneral);

export default router;
