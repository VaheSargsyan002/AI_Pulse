import { FileText, FileJson, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Doc {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  status: string;
  error?: string;
  uploadedAt: string;
  chunkCount: number;
}

const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const timeAgo = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "Just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const FileIcon = ({ name }: { name: string }) => {
  if (name.endsWith(".md")) return <FileJson size={18} color="var(--accent)" />;
  return <FileText size={18} color="var(--accent)" />;
};

interface Props { docs: Doc[]; onDeleted: () => void; }

export default function DocumentList({ docs, onDeleted }: Props) {
  const navigate = useNavigate();

  const del = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this document and its chat history?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    onDeleted();
  };

  if (docs.length === 0) return (
    <div className="doc-empty">
      <div className="doc-empty-icon"><FileText size={24} color="var(--text-secondary)" /></div>
      <h3>No documents yet</h3>
      <p>Upload a PDF, TXT, or Markdown file to get started</p>
    </div>
  );

  return (
    <div className="doc-list">
      {docs.map(doc => (
        <div
          key={doc.id}
          className={`doc-item ${doc.status !== "ready" ? "not-ready" : ""}`}
          onClick={() => doc.status === "ready" && navigate(`/chat/${doc.id}`)}
        >
          <div className="doc-icon">
            <FileIcon name={doc.originalName} />
          </div>
          <div className="doc-info">
            <div className="doc-name">{doc.name}</div>
            <div className={`doc-meta ${doc.status === "error" ? "err" : ""}`}>
              {doc.status === "processing" && "Processing…"}
              {doc.status === "ready" && (
                <>{timeAgo(doc.uploadedAt)} · {fmt(doc.size)} · {doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}</>
              )}
              {doc.status === "error" && <><AlertCircle size={11} /> {doc.error ?? "Error"}</>}
            </div>
          </div>
          <div className="doc-actions">
            {doc.status === "ready" && (
              <button className="btn-icon" title="Chat" onClick={e => { e.stopPropagation(); navigate(`/chat/${doc.id}`); }}>
                <MessageSquare size={15} />
              </button>
            )}
            <button className="btn-icon" title="Delete" onClick={e => del(doc.id, e)}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
