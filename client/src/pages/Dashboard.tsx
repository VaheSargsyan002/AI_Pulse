import DropZone from "../components/DropZone";
import DocumentList from "../components/DocumentList";
import { useDocuments } from "../hooks/useDocuments";

export default function Dashboard() {
  const { docs, mutate } = useDocuments();

  return (
    <div className="main">
      <div className="dashboard">
        <div className="dashboard-header"><h1>Dashboard</h1></div>

        <div className="section">
          <div className="section-title">Upload Documents</div>
          <div className="section-sub">Drop your company handbooks, guides, or policies to enable AI-powered Q&A.</div>
          <DropZone onUploaded={() => mutate()} />
        </div>

        <div className="section">
          <div className="section-heading">
            <div className="section-title">Your Documents</div>
            {docs.length > 0 && <span className="doc-count">{docs.length} document{docs.length !== 1 ? "s" : ""}</span>}
          </div>
          <DocumentList docs={docs} onDeleted={() => mutate()} />
        </div>
      </div>
    </div>
  );
}
