export interface Doc {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  status: "processing" | "ready" | "error";
  error?: string;
  uploadedAt: string;
  chunkCount: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}
