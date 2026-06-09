import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, FileText, BookOpen } from "lucide-react";

interface Doc { id: string; name: string; status: string; }

export default function Sidebar() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = () => fetch("/api/documents").then(r => r.json()).then(setDocs).catch(() => {});
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><BookOpen size={18} color="white" /></div>
        <div>
          <div className="sidebar-logo-title">AI-Pulse</div>
          <div className="sidebar-logo-sub">Onboarder</div>
        </div>
      </div>

      <button className={`sidebar-nav-item ${isActive("/") ? "active" : ""}`} onClick={() => navigate("/")}>
        <LayoutDashboard size={15} /> Dashboard
      </button>
      <button className={`sidebar-nav-item ${isActive("/chat/general") ? "active" : ""}`} onClick={() => navigate("/chat/general")}>
        <MessageSquare size={15} /> All Documents Chat
      </button>

      {docs.length > 0 && (
        <>
          <div className="sidebar-section-label">Documents</div>
          {docs.map(doc => (
            <button
              key={doc.id}
              className={`sidebar-doc-item ${isActive(`/chat/${doc.id}`) ? "active" : ""}`}
              onClick={() => doc.status === "ready" && navigate(`/chat/${doc.id}`)}
            >
              <FileText size={13} style={{ flexShrink: 0 }} />
              <span>{doc.name}</span>
              {doc.status === "processing" && <span className="status-dot processing" />}
              {doc.status === "error" && <span className="status-dot error" />}
            </button>
          ))}
        </>
      )}

      {docs.length === 0 && (
        <>
          <div className="sidebar-section-label">Documents</div>
          <div className="sidebar-empty">
            <MessageSquare size={18} style={{ opacity: 0.4 }} />
            <span>Upload documents to start chatting</span>
          </div>
        </>
      )}
    </aside>
  );
}
