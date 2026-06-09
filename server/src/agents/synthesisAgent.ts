import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface Message { role: "user" | "assistant"; content: string; }

export async function synthesisAgent(
  query: string,
  context: string,
  documentName: string,
  history: Message[]
) {
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
