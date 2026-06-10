import { MessageSquare } from "lucide-react";
import { useDocuments } from "../hooks/useDocuments";
import ChatInterface from "../components/ChatInterface";

const SUGGESTIONS = [
  "What documents are available?",
  "Summarize all documents briefly",
  "What are the key policies across all documents?",
  "Are there any conflicting information between documents?",
];

export default function GeneralChatPage() {
  const { docs } = useDocuments();

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
            {docs.length > 0 && <span className="chat-header-badge">{docs.length} document{docs.length !== 1 ? "s" : ""}</span>}
          </>
        }
      />
    </div>
  );
}
