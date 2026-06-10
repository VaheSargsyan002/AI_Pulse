import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useDocument } from "../hooks/useDocument";
import ChatInterface from "../components/ChatInterface";

const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { doc, isLoading, error } = useDocument(id);

  useEffect(() => {
    if (error?.status === 404) navigate("/");
  }, [error, navigate]);

  if (isLoading) return <div className="main page-center">Loading…</div>;
  if (!doc) return null;
  if (doc.status === "processing") return <div className="main page-center">Processing "{doc.name}"…</div>;
  if (doc.status === "error") return <div className="main page-center" style={{ color: "var(--danger)" }}>{doc.error ?? "Failed to process document."}</div>;

  return (
    <div className="main">
      <ChatInterface
        key={id}
        apiEndpoint="/api/chat"
        documentId={id}
        extraBody={{ documentId: id }}
        placeholder={`Ask a question about ${doc.name}…`}
        header={
          <>
            <FileText size={15} color="var(--accent)" />
            <span className="chat-header-title">{doc.name}</span>
            <span className="chat-header-badge">{fmt(doc.size)}</span>
            {doc.chunkCount != null && <span className="chat-header-badge">{doc.chunkCount} chunks</span>}
          </>
        }
      />
    </div>
  );
}
