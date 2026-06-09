import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import ChatInterface from "../components/ChatInterface";

interface Doc { id: string; name: string; originalName: string; size: number; status: string; error?: string; chunkCount?: number; }

const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = () =>
      fetch(`/api/documents/${id}`).then(r => {
        if (r.status === 404) { navigate("/"); return null; }
        return r.json();
      }).then(d => { if (d) setDoc(d); }).catch(() => {});

    load().finally(() => setLoading(false));
    const interval = setInterval(() => { if (doc?.status !== "ready") load(); }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="main page-center">Loading…</div>;
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
