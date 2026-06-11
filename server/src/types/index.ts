export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface DocSummary {
  name: string;
  chunks: string[];
}
