import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import ChatInterface from "../components/ChatInterface";

const SUGGESTIONS = [
  "What documents are available?",
  "Summarize all documents briefly",
  "What are the key policies across all documents?",
  "Are there any conflicting information between documents?",
];

export default function GeneralChatPage() {
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    fetch("/api/documents").then(r => r.json()).then((d: unknown[]) => setDocCount(d.length)).catch(() => {});
  }, []);

  return (
    <div className="main">
      <ChatInterface
        apiEndpoint="/api/chat/general"
        placeholder="Ask a question across all your documents…"
        suggestions={SUGGESTIONS}
        header={
          <>
            <MessageSquare size={15} color="var(--accent)" />
            <span className="chat-header-title">All Documents Chat</span>
            {docCount > 0 && <span className="chat-header-badge">{docCount} document{docCount !== 1 ? "s" : ""}</span>}
          </>
        }
      />
    </div>
  );
}
