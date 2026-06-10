import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

interface Props {
  apiEndpoint: string;
  documentId?: string;
  extraBody?: Record<string, unknown>;
  placeholder?: string;
  suggestions?: string[];
  header: React.ReactNode;
}

export default function ChatInterface({ apiEndpoint, documentId, extraBody, placeholder, suggestions, header }: Props) {
  const { messages, input, setInput, streaming, send } = useChat(apiEndpoint, documentId, extraBody);

  return (
    <div className="chat-page">
      <div className="chat-header">{header}</div>
      <MessageList
        messages={messages}
        streaming={streaming}
        suggestions={suggestions}
        onSuggestion={send}
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={send}
        placeholder={placeholder}
        disabled={streaming}
      />
    </div>
  );
}
  