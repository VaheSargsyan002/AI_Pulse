"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSessions = exports.documents = exports.documentStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.documentStatusEnum = (0, pg_core_1.pgEnum)("document_status", ["processing", "ready", "error"]);
exports.documents = (0, pg_core_1.pgTable)("documents", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, pg_core_1.text)("name").notNull(),
    originalName: (0, pg_core_1.text)("original_name").notNull(),
    type: (0, pg_core_1.text)("type").notNull(),
    size: (0, pg_core_1.integer)("size").notNull(),
    extractedText: (0, pg_core_1.text)("extracted_text").notNull().default(""),
    chunks: (0, pg_core_1.jsonb)("chunks").$type().notNull().default([]),
    status: (0, exports.documentStatusEnum)("status").notNull().default("processing"),
    error: (0, pg_core_1.text)("error"),
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at").notNull().defaultNow(),
});
exports.chatSessions = (0, pg_core_1.pgTable)("chat_sessions", {
    id: (0, pg_core_1.text)("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    documentId: (0, pg_core_1.text)("document_id"),
    type: (0, pg_core_1.text)("type"),
    title: (0, pg_core_1.text)("title").notNull(),
    messages: (0, pg_core_1.jsonb)("messages").$type().notNull().default([]),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
