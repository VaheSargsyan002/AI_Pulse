import { eq } from "drizzle-orm";
import { db, documents, chatSessions } from "../db";
import type { Message, DocSummary } from "../types";
import { retrievalAgent } from "../agents/retrieval.agent";
import { synthesisAgent } from "../agents/synthesis.agent";
import { generalAgent } from "../agents/general.agent";

export async function getSession(documentId: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.documentId, documentId));
  return session ?? { messages: [] };
}

export async function streamDocumentChat(documentId: string, messages: Message[]) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));

  if (!doc) throw Object.assign(new Error("Document not found."), { status: 404 });
  if (doc.status !== "ready") throw Object.assign(new Error("Document not ready."), { status: 400 });

  const userQuery = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);
  const chunks = retrievalAgent(userQuery, doc.chunks as string[]);
  const context = chunks.join("\n\n---\n\n").slice(0, 3000);

  const stream = await synthesisAgent(userQuery, context, doc.name, history);
  return { stream, doc };
}

export async function streamGeneralChat(messages: Message[]) {
  const readyDocs = await db
    .select({ id: documents.id, name: documents.name, chunks: documents.chunks })
    .from(documents)
    .where(eq(documents.status, "ready"));

  if (!readyDocs.length)
    throw Object.assign(new Error("No ready documents."), { status: 400 });

  const userQuery = messages[messages.length - 1].content;
  const history = messages.slice(0, -1);
  const docSummaries: DocSummary[] = readyDocs.map((d) => ({
    name: d.name,
    chunks: (d.chunks as string[]).slice(0, 5),
  }));

  const stream = await generalAgent(userQuery, docSummaries, history);
  return { stream };
}

export async function saveSession(
  documentId: string,
  title: string,
  userMessages: Message[],
  reply: string
) {
  const all = [...userMessages, { role: "assistant" as const, content: reply }].map((m) => ({
    ...m,
    createdAt: new Date().toISOString(),
  }));

  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.documentId, documentId));

  if (existing) {
    await db
      .update(chatSessions)
      .set({ messages: all as never, updatedAt: new Date() })
      .where(eq(chatSessions.documentId, documentId));
  } else {
    await db.insert(chatSessions).values({ documentId, title, messages: all as never });
  }
}

export async function saveGeneralSession(userMessages: Message[], reply: string) {
  const all = [...userMessages, { role: "assistant" as const, content: reply }].map((m) => ({
    ...m,
    createdAt: new Date().toISOString(),
  }));

  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.type, "general"));

  if (existing) {
    await db
      .update(chatSessions)
      .set({ messages: all as never, updatedAt: new Date() })
      .where(eq(chatSessions.type, "general"));
  } else {
    await db
      .insert(chatSessions)
      .values({ type: "general", title: "All Documents Chat", messages: all as never });
  }
}
