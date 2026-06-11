import { Request, Response } from "express";
import * as documentService from "../services/document.service";

export async function listDocuments(_req: Request, res: Response) {
  try {
    const docs = await documentService.getAllDocuments();
    res.json(docs);
  } catch (err) {
    console.error("[GET /documents]", err);
    res.status(500).json({ error: String(err) });
  }
}

export async function getDocument(req: Request, res: Response) {
  try {
    const doc = await documentService.getDocumentById(String(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found." });
    res.json(doc);
  } catch (err) {
    console.error("[GET /documents/:id]", err);
    res.status(500).json({ error: String(err) });
  }
}

export async function uploadDocument(req: Request, res: Response) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided." });
    const id = await documentService.createDocument(req.file);
    res.status(201).json({ id, status: "processing" });
  } catch (err) {
    console.error("[POST /documents]", err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    await documentService.deleteDocument(String(req.params.id));
    res.json({ success: true });
  } catch (err) {
    console.error("[DELETE /documents/:id]", err);
    res.status(500).json({ error: String(err) });
  }
}
