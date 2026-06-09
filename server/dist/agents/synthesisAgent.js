"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesisAgent = synthesisAgent;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
async function synthesisAgent(query, context, documentName, history) {
    return groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        stream: true,
        messages: [
            {
                role: "system",
                content: `You are an AI Onboarding Assistant for "${documentName}". Use ONLY the provided context to answer. If the answer is not in the context, say so. Always cite the document name. Use markdown formatting where helpful.`,
            },
            ...history,
            {
                role: "user",
                content: `CONTEXT FROM "${documentName}":\n\n${context}\n\n---\n\nQUESTION: ${query}`,
            },
        ],
    });
}
