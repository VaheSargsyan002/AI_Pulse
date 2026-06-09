import { useEffect, useState } from "react";
import DropZone from "../components/DropZone";
import DocumentList from "../components/DocumentList";

interface Doc { id: string; name: string; originalName: string; type: string; size: number; status: string; error?: string; uploadedAt: string; chunkCount: number; }

export default function Dashboard() {
  const [docs, setDocs] = useState<Doc[]>([]);

  const load = () => fetch("/api/documents").then(r => r.json()).then(setDocs).catch(() => {});

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="main">
      <div className="dashboard">
        <div className="dashboard-header"><h1>Dashboard</h1></div>

        <div className="section">
          <div className="section-title">Upload Documents</div>
          <div className="section-sub">Drop your company handbooks, guides, or policies to enable AI-powered Q&A.</div>
          <DropZone onUploaded={load} />
        </div>

        <div className="section">
          <div className="section-heading">
            <div className="section-title">Your Documents</div>
            {docs.length > 0 && <span className="doc-count">{docs.length} document{docs.length !== 1 ? "s" : ""}</span>}
          </div>
          <DocumentList docs={docs} onDeleted={load} />
        </div>
      </div>
    </div>
  );
}
