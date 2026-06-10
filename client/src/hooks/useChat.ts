import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";

export function useChat(
  apiEndpoint: string,
  documentId?: string,
  extraBody: Record<string, unknown> = {}
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const extraBodyRef = useRef(extraBody);
  extraBodyRef.current = extraBody;

  useEffect(() => {
    if (!documentId) return;
    setMessages([]);
    fetch(`/api/chat/session?documentId=${documentId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.messages?.length) setMessages(data.messages); })
      .catch(() => {});
  }, [documentId]);

  const send = useCallback(async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];

    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, documentId, ...extraBodyRef.current }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            const { text } = JSON.parse(data);
            if (text) {
              acc += text;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "Error generating response." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, apiEndpoint, documentId]);

  return { messages, input, setInput, streaming, send };
}
