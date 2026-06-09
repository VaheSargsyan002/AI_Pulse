import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  return splitter.splitText(text);
}
