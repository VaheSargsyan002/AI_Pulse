import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";

interface Props { onUploaded: () => void; }

const fmt = (b: number) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export default function DropZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [staged, setStaged] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stage = (file: File) => {
    if (!file.name.match(/\.(pdf|txt|md)$/i)) { setError("Only PDF, TXT, or Markdown allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10MB."); return; }
    setError(null);
    setStaged(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) stage(e.dataTransfer.files[0]);
  }, []);

  const upload = async () => {
    if (!staged) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", staged);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      setStaged(null);
      onUploaded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".pdf,.txt,.md" style={{ display: "none" }}
          onChange={e => { if (e.target.files?.[0]) stage(e.target.files[0]); e.target.value = ""; }} />
        <div className="dropzone-icon"><Upload size={22} color="var(--accent)" /></div>
        <div className="dropzone-title">Drop your documents here</div>
        <div className="dropzone-sub">PDF, TXT, or Markdown up to 10MB</div>
        <span className="dropzone-browse">Browse files</span>
      </div>

      {staged && (
        <div>
          <div className="staged-file">
            <FileText size={18} color="var(--accent)" />
            <div className="staged-file-info">
              <div className="staged-file-name">{staged.name}</div>
              <div className="staged-file-size">{fmt(staged.size)}</div>
            </div>
            <button className="staged-remove" onClick={e => { e.stopPropagation(); setStaged(null); }}>
              <X size={16} />
            </button>
          </div>
          <button className="btn-upload" disabled={uploading} onClick={upload}>
            {uploading ? "Uploading…" : "Upload 1 file"}
          </button>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}
