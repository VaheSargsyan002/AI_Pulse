import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User } from "lucide-react";
import type { ChatMessage } from "../types";

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
}

export default function MessageList({ messages, streaming, suggestions = [], onSuggestion }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-messages">
      {messages.length === 0 && suggestions.length > 0 && (
        <div className="chat-empty">
          <div className="chat-empty-icon"><Bot size={24} color="var(--accent)" /></div>
          <div className="chat-empty-title">Chat with your document</div>
          <div className="suggestions">
            {suggestions.map(q => (
              <button key={q} className="suggestion-btn" onClick={() => onSuggestion?.(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <div className="message-avatar">
            {msg.role === "user"
              ? <User size={13} color="white" />
              : <Bot size={13} color="var(--accent)" />}
          </div>
          <div className="message-bubble">
            {msg.role === "assistant" && msg.content === "" && streaming
              ? <span className="typing-dots"><span /><span /><span /></span>
              : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
