import { FileText } from "lucide-react";
import DocumentItem from "./DocumentItem";
import type { Doc } from "../types";

interface Props {
  docs: Doc[];
  onDeleted: () => void;
}

export default function DocumentList({ docs, onDeleted }: Props) {
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
        <DocumentItem key={doc.id} doc={doc} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
