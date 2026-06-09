"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const chunker_1 = require("../lib/chunker");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pdfParse = require("pdf-parse");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadLimiter = (0, express_rate_limit_1.default)({ windowMs: 60000, max: 10, message: { error: "Rate limit: max 10 uploads per minute." } });
router.get("/", async (_req, res) => {
    try {
        const rows = await db_1.db.select({
            id: db_1.documents.id, name: db_1.documents.name, originalName: db_1.documents.originalName,
            type: db_1.documents.type, size: db_1.documents.size, status: db_1.documents.status,
            error: db_1.documents.error, uploadedAt: db_1.documents.uploadedAt,
            chunks: db_1.documents.chunks,
        }).from(db_1.documents).orderBy(db_1.documents.uploadedAt);
        const docs = rows.map(({ chunks, ...rest }) => ({
            ...rest,
            chunkCount: chunks.length,
        }));
        res.json(docs);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const id = String(req.params.id);
        const [doc] = await db_1.db.select({
            id: db_1.documents.id, name: db_1.documents.name, originalName: db_1.documents.originalName,
            type: db_1.documents.type, size: db_1.documents.size, status: db_1.documents.status,
            error: db_1.documents.error, uploadedAt: db_1.documents.uploadedAt,
        }).from(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.id, id));
        if (!doc)
            return res.status(404).json({ error: "Not found." });
        res.json(doc);
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
router.post("/", uploadLimiter, upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ error: "No file provided." });
        const allowed = ["application/pdf", "text/plain", "text/markdown"];
        if (!allowed.includes(file.mimetype) && !file.originalname.match(/\.(pdf|txt|md)$/i)) {
            return res.status(400).json({ error: "Only PDF, TXT, or Markdown allowed." });
        }
        const name = file.originalname.replace(/\.[^/.]+$/, "");
        const [inserted] = await db_1.db.insert(db_1.documents).values({
            name, originalName: file.originalname, type: file.mimetype,
            size: file.size, status: "processing", extractedText: "", chunks: [],
        }).returning({ id: db_1.documents.id });
        processDocument(inserted.id, file.buffer, file.mimetype, file.originalname).catch(async (err) => {
            await db_1.db.update(db_1.documents).set({ status: "error", error: String(err) }).where((0, drizzle_orm_1.eq)(db_1.documents.id, inserted.id));
        });
        res.status(201).json({ id: inserted.id, status: "processing" });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const id = String(req.params.id);
        await db_1.db.delete(db_1.chatSessions).where((0, drizzle_orm_1.eq)(db_1.chatSessions.documentId, id));
        await db_1.db.delete(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.id, id));
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: String(err) });
    }
});
async function processDocument(id, buffer, mimeType, fileName) {
    let extractedText = "";
    const isPdf = mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    if (isPdf) {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text.trim();
        if (!extractedText) {
            await db_1.db.update(db_1.documents).set({ status: "error", error: "OCR Required: scanned PDF has no extractable text." }).where((0, drizzle_orm_1.eq)(db_1.documents.id, id));
            return;
        }
    }
    else {
        extractedText = buffer.toString("utf-8");
    }
    const chunks = await (0, chunker_1.chunkText)(extractedText);
    await db_1.db.update(db_1.documents).set({ extractedText, chunks, status: "ready" }).where((0, drizzle_orm_1.eq)(db_1.documents.id, id));
}
exports.default = router;
