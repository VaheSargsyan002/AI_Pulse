import { Send } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({ value, onChange, onSend, placeholder, disabled }: Props) {
  return (
    <div className="chat-input-area">
      <div className="chat-input-box">
        <textarea
          className="chat-textarea"
          value={value}
          rows={1}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(value); }
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          className={`btn-send ${value.trim() ? "active" : ""}`}
          disabled={!value.trim() || disabled}
          onClick={() => onSend(value)}
        >
          <Send size={14} />
        </button>
      </div>
      <div className="chat-disclaimer">
        AI responses are generated from the document content. Always verify important information.
      </div>
    </div>
  );
}
