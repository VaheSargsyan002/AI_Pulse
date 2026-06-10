# AI-Pulse Onboarder

A document-powered AI chat assistant. Upload company PDFs, TXT, or Markdown files and chat with them using AI — per-document or across your entire knowledge base.

## Features

- Upload PDF, TXT, and Markdown documents (up to 10 MB)
- Per-document chat with context-aware AI responses
- Cross-document "Knowledge Base" chat across all uploaded files
- Real-time document processing status with SWR polling
- Streaming AI responses with Markdown rendering
- Chat history persisted per document
- Cascade delete (removes document and its chat history)
- Rate limiting: 10 uploads per minute
- Collapsible sidebar

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
- A [Groq API key](https://console.groq.com) (free)

## Setup

**1. Clone the repository**

```bash
git clone <repo-url>
cd "AI-Pulse Onboarder"
```

**2. Create the `.env` file** in the project root:

```env
DATABASE_URL=postgresql://ecrud:ecrud_pass@postgres:5432/aipulse
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

> Replace `your_groq_api_key_here` with your actual key from [console.groq.com](https://console.groq.com).

## Running the Project

**First time (or after any code change):**

```bash
docker compose up --build
```

**After that — start without rebuilding:**

```bash
docker compose up
```

Once running, open your browser at:

```
http://localhost:5173
```

## Stopping the Project

```bash
docker compose down
```

To also wipe the database and all stored documents:

```bash
docker compose down -v
```

## Project Structure

```
AI-Pulse Onboarder/
├── client/                  # React frontend (Vite + TypeScript)
│   └── src/
│       ├── hooks/           # Custom hooks (useDocuments, useDocument, useChat)
│       ├── components/      # UI components (ChatInterface, DocumentList, DropZone …)
│       ├── pages/           # Route-level pages (Dashboard, ChatPage, GeneralChatPage)
│       └── types.ts         # Shared TypeScript interfaces
├── server/                  # Node.js API (Express + TypeScript)
│   └── src/
│       ├── routes/          # documents.ts, chat.ts
│       ├── agents/          # retrievalAgent, synthesisAgent, generalAgent
│       ├── lib/             # chunker.ts (LangChain text splitter)
│       └── db/              # Drizzle schema + connection
├── docker-compose.yml
└── .env                     # You create this (see Setup above)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| State / Fetching | SWR (real-time polling + cache deduplication) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI / LLM | Groq API — Llama 3.3 70B (streaming) |
| Text Processing | LangChain RecursiveCharacterTextSplitter, pdf-parse |
| Infrastructure | Docker Compose (3 containers: client, server, postgres) |
