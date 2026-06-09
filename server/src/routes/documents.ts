import { Router, Request, Response } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import pdfParse from "pdf-parse";
import { eq, desc } from "drizzle-orm";

import { db, documents, chatSessions } from "../db";
import { chunkText } from "../lib/chunker";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: "Rate limit: max 10 uploads per minute." },
});

//
// ==========================
// GET ALL DOCUMENTS
// ==========================
//
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        type: documents.type,
        size: documents.size,
        status: documents.status,
        error: documents.error,
        uploadedAt: documents.uploadedAt,
        chunks: documents.chunks,
      })
      .from(documents)
      .orderBy(desc(documents.uploadedAt));

    const docs = rows.map((r) => ({
      id: r.id,
      name: r.name,
      originalName: r.originalName,
      type: r.type,
      size: r.size,
      status: r.status,
      error: r.error,
      uploadedAt: r.uploadedAt,
      chunkCount: Array.isArray(r.chunks) ? r.chunks.length : 0,
    }));

    res.json(docs);
  } catch (err) {
    console.error("[GET /documents]", err);
    res.status(500).json({ error: String(err) });
  }
});

//
// ==========================
// GET SINGLE DOCUMENT
// ==========================
//
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const [doc] = await db
      .select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        type: documents.type,
        size: documents.size,
        status: documents.status,
        error: documents.error,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .where(eq(documents.id, id));

    if (!doc) return res.status(404).json({ error: "Not found." });

    res.json(doc);
  } catch (err) {
    console.error("[GET /documents/:id]", err);
    res.status(500).json({ error: String(err) });
  }
});

//
// ==========================
// GET CHAT SESSION (FIXED)
// ==========================
//
router.get("/session", async (req: Request, res: Response) => {
  try {
    const { documentId } = req.query;

    if (!documentId) {
      return res.status(400).json({ error: "documentId required" });
    }

    const [session] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.documentId, String(documentId)));

    res.json(session ?? { messages: [] });
  } catch (err) {
    console.error("[GET /session]", err);
    res.status(500).json({ error: String(err) });
  }
});

//
// ==========================
// UPLOAD DOCUMENT
// ==========================
//
router.post(
  "/",
  uploadLimiter,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      const allowed = [
        "application/pdf",
        "text/plain",
        "text/markdown",
      ];

      if (
        !allowed.includes(file.mimetype) &&
        !file.originalname.match(/\.(pdf|txt|md)$/i)
      ) {
        return res.status(400).json({
          error: "Only PDF, TXT, or Markdown allowed.",
        });
      }

      const name = file.originalname.replace(/\.[^/.]+$/, "");

      const [inserted] = await db
        .insert(documents)
        .values({
          name,
          originalName: file.originalname,
          type: file.mimetype,
          size: file.size,
          status: "processing",
          extractedText: "",
          chunks: [],
        })
        .returning({ id: documents.id });

      processDocument(
        inserted.id,
        file.buffer,
        file.mimetype,
        file.originalname
      ).catch(async (err) => {
        console.error("[PROCESS ERROR]", err);

        await db
          .update(documents)
          .set({
            status: "error",
            error: String(err),
          })
          .where(eq(documents.id, inserted.id));
      });

      res.status(201).json({
        id: inserted.id,
        status: "processing",
      });
    } catch (err) {
      console.error("[UPLOAD ERROR]", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

//
// ==========================
// DELETE DOCUMENT (CASCADE)
// ==========================
//
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    await db
      .delete(chatSessions)
      .where(eq(chatSessions.documentId, id));

    await db.delete(documents).where(eq(documents.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /documents/:id]", err);
    res.status(500).json({ error: String(err) });
  }
});

//
// ==========================
// DOCUMENT PROCESSING PIPELINE
// ==========================
//
async function processDocument(
  id: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string
) {
  try {
    let extractedText = "";

    const isPdf =
      mimeType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      let parsed;

      try {
        parsed = await pdfParse(buffer);
      } catch {
        await db
          .update(documents)
          .set({
            status: "error",
            error: "PDF parsing failed (corrupted or unsupported file).",
          })
          .where(eq(documents.id, id));
        return;
      }

      extractedText = parsed.text?.trim() || "";

      if (!extractedText) {
        await db
          .update(documents)
          .set({
            status: "error",
            error:
              "OCR Required: scanned PDF has no extractable text.",
          })
          .where(eq(documents.id, id));
        return;
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    const chunks = await chunkText(extractedText);

    await db
      .update(documents)
      .set({
        extractedText,
        chunks,
        status: "ready",
      })
      .where(eq(documents.id, id));
  } catch (err) {
    console.error("[PROCESS DOCUMENT]", err);

    await db
      .update(documents)
      .set({
        status: "error",
        error: String(err),
      })
      .where(eq(documents.id, id));
  }
}

export default router;