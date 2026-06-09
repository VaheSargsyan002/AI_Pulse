"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalAgent = generalAgent;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const groq = new groq_sdk_1.default({ apiKey: process.env.GROQ_API_KEY });
async function generalAgent(query, docs, history) {
    const context = docs
        .map((d) => `=== ${d.name} ===\n${d.chunks.slice(0, 3).join("\n\n")}`)
        .join("\n\n");
    return groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        stream: true,
        messages: [
            {
                role: "system",
                content: "You are an AI Onboarding Assistant with access to multiple company documents. Answer using only the provided context. Cite document names. Use markdown formatting where helpful.",
            },
            ...history,
            {
                role: "user",
                content: `KNOWLEDGE BASE:\n\n${context}\n\n---\n\nQUESTION: ${query}`,
            },
        ],
    });
}
