import { FileText, FileJson, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Doc } from "../types";

const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "Just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
};

interface Props {
  doc: Doc;
  onDeleted: () => void;
}

export default function DocumentItem({ doc, onDeleted }: Props) {
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this document and its chat history?")) return;
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    onDeleted();
  };

  return (
    <div
      className={`doc-item ${doc.status !== "ready" ? "not-ready" : ""}`}
      onClick={() => doc.status === "ready" && navigate(`/chat/${doc.id}`)}
    >
      <div className="doc-icon">
        {doc.originalName.endsWith(".md")
          ? <FileJson size={18} color="var(--accent)" />
          : <FileText size={18} color="var(--accent)" />}
      </div>

      <div className="doc-info">
        <div className="doc-name">{doc.name}</div>
        <div className={`doc-meta ${doc.status === "error" ? "err" : ""}`}>
          {doc.status === "processing" && "Processing…"}
          {doc.status === "ready" && <>{timeAgo(doc.uploadedAt)} · {fmt(doc.size)} · {doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}</>}
          {doc.status === "error" && <><AlertCircle size={11} /> {doc.error ?? "Error"}</>}
        </div>
      </div>

      <div className="doc-actions">
        {doc.status === "ready" && (
          <button className="btn-icon" title="Chat" onClick={e => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}>
            <MessageSquare size={15} />
          </button>
        )}
        <button className="btn-icon" title="Delete" onClick={handleDelete}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
