import { Router } from "express";
import { uploadLimiter, upload, validateFileType } from "../middleware/upload";
import * as controller from "../controllers/document.controller";

const router = Router();

router.get("/", controller.listDocuments);
router.get("/:id", controller.getDocument);
router.post("/", uploadLimiter, upload.single("file"), validateFileType, controller.uploadDocument);
router.delete("/:id", controller.deleteDocument);

export default router;
