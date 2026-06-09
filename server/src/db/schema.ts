import { pgTable, text, integer, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const documentStatusEnum = pgEnum("document_status", ["processing", "ready", "error"]);

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  extractedText: text("extracted_text").notNull().default(""),
  chunks: jsonb("chunks").$type<string[]> ().notNull().default([]),
  status: documentStatusEnum("status").notNull().default("processing"),
  error: text("error"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id"),
  type: text("type"),
  title: text("title").notNull(),
  messages: jsonb("messages").$type<ChatMessage[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
