"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const retrievalAgent_1 = require("../agents/retrievalAgent");
const synthesisAgent_1 = require("../agents/synthesisAgent");
const generalAgent_1 = require("../agents/generalAgent");
const router = (0, express_1.Router)();
router.post("/", async (req, res) => {
    try {
        const { documentId, messages } = req.body;
        if (!documentId || !messages?.length)
            return res.status(400).json({ error: "documentId and messages required." });
        const [doc] = await db_1.db.select().from(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.id, documentId));
        if (!doc)
            return res.status(404).json({ error: "Document not found." });
        if (doc.status !== "ready")
            return res.status(400).json({ error: "Document not ready." });
        const userQuery = messages[messages.length - 1].content;
        const history = messages.slice(0, -1);
        const chunks = (0, retrievalAgent_1.retrievalAgent)(userQuery, doc.chunks);
        const context = chunks.join("\n\n---\n\n").slice(0, 3000);
        const stream = await (0, synthesisAgent_1.synthesisAgent)(userQuery, context, doc.name, history);
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
    }
    catch (err) {
        console.error("[POST /api/chat]", err);
        if (!res.headersSent)
            res.status(500).json({ error: String(err) });
    }
});
router.post("/general", async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages?.length)
            return res.status(400).json({ error: "messages required." });
        const readyDocs = await db_1.db.select({ id: db_1.documents.id, name: db_1.documents.name, chunks: db_1.documents.chunks })
            .from(db_1.documents).where((0, drizzle_orm_1.eq)(db_1.documents.status, "ready"));
        if (!readyDocs.length)
            return res.status(400).json({ error: "No ready documents." });
        const userQuery = messages[messages.length - 1].content;
        const history = messages.slice(0, -1);
        const docSummaries = readyDocs.map((d) => ({ name: d.name, chunks: d.chunks.slice(0, 5) }));
        const stream = await (0, generalAgent_1.generalAgent)(userQuery, docSummaries, history);
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
    }
    catch (err) {
        console.error("[POST /api/chat/general]", err);
        if (!res.headersSent)
            res.status(500).json({ error: String(err) });
    }
});
async function saveSession(documentId, title, userMessages, reply) {
    const all = [...userMessages, { role: "assistant", content: reply }].map((m) => ({ ...m, createdAt: new Date().toISOString() }));
    const [existing] = await db_1.db.select().from(db_1.chatSessions).where((0, drizzle_orm_1.eq)(db_1.chatSessions.documentId, documentId));
    if (existing) {
        await db_1.db.update(db_1.chatSessions).set({ messages: all, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(db_1.chatSessions.documentId, documentId));
    }
    else {
        await db_1.db.insert(db_1.chatSessions).values({ documentId, title, messages: all });
    }
}
async function saveGeneralSession(userMessages, reply) {
    const all = [...userMessages, { role: "assistant", content: reply }].map((m) => ({ ...m, createdAt: new Date().toISOString() }));
    const [existing] = await db_1.db.select().from(db_1.chatSessions).where((0, drizzle_orm_1.eq)(db_1.chatSessions.type, "general"));
    if (existing) {
        await db_1.db.update(db_1.chatSessions).set({ messages: all, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(db_1.chatSessions.type, "general"));
    }
    else {
        await db_1.db.insert(db_1.chatSessions).values({ type: "general", title: "All Documents Chat", messages: all });
    }
}
exports.default = router;
