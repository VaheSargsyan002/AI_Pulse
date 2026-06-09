import { Router, Request, Response } from "express";
import { db, documents, chatSessions } from "../db";
import { eq } from "drizzle-orm";
import { retrievalAgent } from "../agents/retrievalAgent";
import { synthesisAgent } from "../agents/synthesisAgent";
import { generalAgent } from "../agents/generalAgent";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { documentId, messages } = req.body;
    if (!documentId || !messages?.length) return res.status(400).json({ error: "documentId and messages required." });

    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
    if (!doc) return res.status(404).json({ error: "Document not found." });
    if (doc.status !== "ready") return res.status(400).json({ error: "Document not ready." });

    const userQuery = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map(({ role, content }: { role: "user" | "assistant"; content: string }) => ({ role, content }));
    const chunks = retrievalAgent(userQuery, doc.chunks as string[]);
    const context = chunks.join("\n\n---\n\n").slice(0, 3000);

    const stream = await synthesisAgent(userQuery, context, doc.name, history);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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

    saveSession(documentId, doc.name, messages, fullResponse).catch(console.error);
  } catch (err) {
    console.error("[POST /api/chat]", err);
    if (!res.headersSent) res.status(500).json({ error: String(err) });
  }
});

router.post("/general", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "messages required." });

    const readyDocs = await db.select({ id: documents.id, name: documents.name, chunks: documents.chunks })
      .from(documents).where(eq(documents.status, "ready"));
    if (!readyDocs.length) return res.status(400).json({ error: "No ready documents." });

    const userQuery = messages[messages.length - 1].content;
    const history = messages.slice(0, -1).map(({ role, content }: { role: "user" | "assistant"; content: string }) => ({ role, content }));
    const docSummaries = readyDocs.map((d) => ({ name: d.name, chunks: (d.chunks as string[]).slice(0, 5) }));

    const stream = await generalAgent(userQuery, docSummaries, history);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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

    saveGeneralSession(messages, fullResponse).catch(console.error);
  } catch (err) {
    console.error("[POST /api/chat/general]", err);
    if (!res.headersSent) res.status(500).json({ error: String(err) });
  }
});

router.get("/session", async (req, res) => {
  const { documentId } = req.query;

  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.documentId, String(documentId)));

  if (!session) return res.json({ messages: [] });

  res.json(session);
});

async function saveSession(documentId: string, title: string, userMessages: { role: string; content: string }[], reply: string) {
  const all = [...userMessages, { role: "assistant", content: reply }].map((m) => ({ ...m, createdAt: new Date().toISOString() }));
  const [existing] = await db.select().from(chatSessions).where(eq(chatSessions.documentId, documentId));
  if (existing) {
    await db.update(chatSessions).set({ messages: all as never, updatedAt: new Date() }).where(eq(chatSessions.documentId, documentId));
  } else {
    await db.insert(chatSessions).values({ documentId, title, messages: all as never });
  }
}

async function saveGeneralSession(userMessages: { role: string; content: string }[], reply: string) {
  const all = [...userMessages, { role: "assistant", content: reply }].map((m) => ({ ...m, createdAt: new Date().toISOString() }));
  const [existing] = await db.select().from(chatSessions).where(eq(chatSessions.type, "general"));
  if (existing) {
    await db.update(chatSessions).set({ messages: all as never, updatedAt: new Date() }).where(eq(chatSessions.type, "general"));
  } else {
    await db.insert(chatSessions).values({ type: "general", title: "All Documents Chat", messages: all as never });
  }
}

export default router;
