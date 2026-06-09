# AI-Pulse Onboarder

A document-powered AI chat assistant. Upload company PDFs, TXT, or Markdown files and chat with them using AI — per-document or across your entire knowledge base.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
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

```bash
docker compose up --build
```

This builds and starts three containers: the React frontend, the Node.js API server, and PostgreSQL. The database schema is created automatically on first run.

Once running, open your browser at:

```
http://localhost:5173
```

## Stopping the Project

```bash
docker compose down
```

To also delete the stored documents and database:

```bash
docker compose down -v
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI / LLM | Groq API (Llama 3.3 70B) |
| Text Processing | LangChain text splitter, pdf-parse |
| Infrastructure | Docker Compose |
