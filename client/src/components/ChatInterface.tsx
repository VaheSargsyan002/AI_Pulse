import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Props {
  apiEndpoint: string;
  documentId?: string;
  extraBody?: Record<string, unknown>;
  placeholder?: string;
  suggestions?: string[];
  header: React.ReactNode;
}

export default function ChatInterface({
  apiEndpoint,
  documentId,
  extraBody = {},
  placeholder = "Ask a question…",
  suggestions = [],
  header,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // LOAD CHAT HISTORY (FIX: persistence + no cross-doc mixing)
  useEffect(() => {
    if (!documentId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/chat/session?documentId=${documentId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data?.messages) {
          setMessages(data.messages);
        }
      } catch {
        // ignore
      }
    };

    load();
  }, [documentId]);

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || streaming) return;

      const userMsg: Message = {
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMsg];

      setMessages([
        ...nextMessages,
        { role: "assistant", content: "" },
      ]);

      setInput("");
      setStreaming(true);

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            documentId,
            ...extraBody,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = dec.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;

            const data = line.slice(6);

            if (data === "[DONE]") return;

            try {
              const { text } = JSON.parse(data);
              if (text) {
                acc += text;

                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    role: "assistant",
                    content: acc,
                  };
                  return copy;
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Error generating response.",
          };
          return copy;
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, apiEndpoint, documentId, extraBody]
  );

  return (
    <div className="chat-page">
      <div className="chat-header">{header}</div>

      <div className="chat-messages">
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <Bot size={24} color="var(--accent)" />
            </div>
            <div className="chat-empty-title">
              Chat with your document
            </div>

            <div className="suggestions">
              {suggestions.map((q) => (
                <button
                  key={q}
                  className="suggestion-btn"
                  onClick={() => send(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === "user" ? (
                <User size={13} color="white" />
              ) : (
                <Bot size={13} color="var(--accent)" />
              )}
            </div>

            <div className="message-bubble">
              {msg.role === "assistant" && msg.content === "" && streaming ? (
                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            className="chat-textarea"
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={placeholder}
            disabled={streaming}
          />
          <button
            className={`btn-send ${input.trim() ? "active" : ""}`}
            disabled={!input.trim() || streaming}
            onClick={() => send(input)}
          >
            <Send size={14} />
          </button>
        </div>
        <div className="chat-disclaimer">AI responses are generated from the document content. Always verify important information.</div>
      </div>
    </div>
  );
}