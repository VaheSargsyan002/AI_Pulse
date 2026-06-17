import multer from "multer";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: "Rate limit: max 10 uploads per minute." },
});

// FIX 7: rate-limit chat endpoints to prevent cost abuse / DoS
export const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: "Rate limit: max 30 messages per minute." },
});

const ALLOWED_MIMETYPES = ["application/pdf", "text/plain", "text/markdown"];
const ALLOWED_EXTENSIONS = /\.(pdf|txt|md)$/i;

export function validateFileType(req: Request, res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) return next();
  if (!ALLOWED_MIMETYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.test(file.originalname)) {
    return res.status(400).json({ error: "Only PDF, TXT, or Markdown allowed." });
  }
  next();
}
