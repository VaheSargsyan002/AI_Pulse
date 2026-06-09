import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface Message { role: "user" | "assistant"; content: string; }
export interface DocSummary { name: string; chunks: string[]; }

export async function generalAgent(query: string, docs: DocSummary[], history: Message[]) {
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
