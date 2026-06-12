import { Request, Response } from "express";
import type { Message } from "../types";
import * as chatService from "../services/chat.service";

function setSseHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

export async function chatWithDocument(req: Request, res: Response) {
  try {
    const { documentId, messages }: { documentId: string; messages: Message[] } = req.body;
    if (!documentId || !messages?.length)
      return res.status(400).json({ error: "documentId and messages required." });

    const { stream, doc } = await chatService.streamDocumentChat(documentId, messages);

    setSseHeaders(res);
    let fullResponse = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();

    chatService.saveSession(documentId, doc.name, messages, fullResponse).catch(console.error);
  } catch (err: any) {
    console.error("[POST /api/chat]", err);
    if (!res.headersSent)
      res.status(err?.status ?? 500).json({ error: err?.message ?? String(err) });
  }
}

export async function chatGeneral(req: Request, res: Response) {
  try {
    const { messages }: { messages: Message[] } = req.body;
    if (!messages?.length)
      return res.status(400).json({ error: "messages required." });

    const { stream } = await chatService.streamGeneralChat(messages);

    setSseHeaders(res);
    let fullResponse = "";
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();

    chatService.saveGeneralSession(messages, fullResponse).catch(console.error);
  } catch (err: any) {
    console.error("[POST /api/chat/general]", err);
    if (!res.headersSent)
      res.status(err?.status ?? 500).json({ error: err?.message ?? String(err) });
  }
}

export async function getChatSession(req: Request, res: Response) {
  try {
    const { documentId } = req.query;
    if (!documentId) return res.status(400).json({ error: "documentId required" });
    const session = await chatService.getSession(String(documentId));
    res.json(session);
  } catch (err) {
    console.error("[GET /api/chat/session]", err);
    res.status(500).json({ error: String(err) });
  }
}

export async function getGeneralChatSession(_req: Request, res: Response) {
  try {
    const session = await chatService.getGeneralSession();
    res.json(session);
  } catch (err) {
    console.error("[GET /api/chat/general/session]", err);
    res.status(500).json({ error: String(err) });
  }
}
