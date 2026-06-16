import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "../types";

// Module-level store — survives component unmount/remount
const memoryCache = new Map<string, ChatMessage[]>();
const activeStreams = new Map<string, boolean>();
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, cb: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => listeners.get(key)?.delete(cb);
}

function setCache(key: string, msgs: ChatMessage[]) {
  memoryCache.set(key, msgs);
  listeners.get(key)?.forEach(cb => cb());
}

function setStreaming(key: string, value: boolean) {
  if (value) activeStreams.set(key, true);
  else activeStreams.delete(key);
  listeners.get(key)?.forEach(cb => cb());
}

export function useChat(
  apiEndpoint: string,
  documentId?: string,
  extraBody: Record<string, unknown> = {}
) {
  const cacheKey = documentId ?? apiEndpoint;
  const [, forceUpdate] = useState(0);
  const [input, setInput] = useState("");
  const extraBodyRef = useRef(extraBody);
  extraBodyRef.current = extraBody;

  // Re-render this component whenever the store notifies for this key
  useEffect(() => {
    return subscribe(cacheKey, () => forceUpdate(n => n + 1));
  }, [cacheKey]);

  // Load session from DB on first mount if cache is empty
  useEffect(() => {
    if ((memoryCache.get(cacheKey)?.length ?? 0) > 0) return;
    const controller = new AbortController();
    const url = documentId
      ? `/api/chat/session?documentId=${documentId}`
      : `/api/chat/general/session`;
    fetch(url, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.messages?.length) setCache(cacheKey, data.messages); })
      .catch(err => { if (err.name !== "AbortError") console.error(err); });
    return () => controller.abort();
  }, [cacheKey, documentId]);

  const send = useCallback(async (content: string) => {
    if (!content.trim() || activeStreams.get(cacheKey)) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    const current = memoryCache.get(cacheKey) ?? [];
    const nextMessages = [...current, userMsg];

    setCache(cacheKey, [...nextMessages, { role: "assistant", content: "" }]);
    setStreaming(cacheKey, true);

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
              const msgs = memoryCache.get(cacheKey) ?? [];
              const copy = [...msgs];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              setCache(cacheKey, copy);
            }
          } catch { /* ignore partial JSON */ }
        }
      }
    } catch {
      const msgs = memoryCache.get(cacheKey) ?? [];
      const copy = [...msgs];
      copy[copy.length - 1] = { role: "assistant", content: "Error generating response." };
      setCache(cacheKey, copy);
    } finally {
      setStreaming(cacheKey, false);
    }
  }, [cacheKey, apiEndpoint, documentId]);

  return {
    messages: memoryCache.get(cacheKey) ?? [],
    input,
    setInput,
    streaming: activeStreams.get(cacheKey) ?? false,
    send,
  };
}
