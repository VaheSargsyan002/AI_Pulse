import { eq, desc } from "drizzle-orm";
import pdfParse from "pdf-parse";
import { db, documents, chatSessions } from "../db";
import { chunkText } from "../lib/chunker";

export async function getAllDocuments() {
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

  return rows.map(({ chunks, ...rest }) => ({
    ...rest,
    chunkCount: Array.isArray(chunks) ? chunks.length : 0,
  }));
}

export async function getDocumentById(id: string) {
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

  return doc ?? null;
}

export async function createDocument(file: Express.Multer.File) {
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

  processDocument(inserted.id, file.buffer, file.mimetype, file.originalname).catch(
    async (err) => {
      await db
        .update(documents)
        .set({ status: "error", error: String(err) })
        .where(eq(documents.id, inserted.id));
    }
  );

  return inserted.id;
}

export async function deleteDocument(id: string) {
  await db.delete(chatSessions).where(eq(chatSessions.documentId, id));
  await db.delete(documents).where(eq(documents.id, id));
}

async function processDocument(
  id: string,
  buffer: Buffer,
  mimeType: string,
  fileName: string
) {
  try {
    let extractedText = "";
    const isPdf =
      mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      let parsed;
      try {
        parsed = await pdfParse(buffer);
      } catch {
        await db
          .update(documents)
          .set({ status: "error", error: "PDF parsing failed (corrupted or unsupported file)." })
          .where(eq(documents.id, id));
        return;
      }

      extractedText = parsed.text?.trim() || "";
      if (!extractedText) {
        await db
          .update(documents)
          .set({ status: "error", error: "OCR Required: scanned PDF has no extractable text." })
          .where(eq(documents.id, id));
        return;
      }
    } else {
      extractedText = buffer.toString("utf-8");
    }

    const chunks = await chunkText(extractedText);
    await db
      .update(documents)
      .set({ extractedText, chunks, status: "ready" })
      .where(eq(documents.id, id));
  } catch (err) {
    await db
      .update(documents)
      .set({ status: "error", error: String(err) })
      .where(eq(documents.id, id));
  }
}
