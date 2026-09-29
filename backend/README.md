# rag-backend

A lightweight NestJS boilerplate backend for a RAG (Retrieval-Augmented Generation) chatbox. Meant to sit behind a Next.js frontend and deploy comfortably on Render's free tier.

For step-by-step setup instructions (clone → running chat), see **[GETTING_STARTED.md](GETTING_STARTED.md)**. This file explains what each part of the backend does.

## What this backend does

A user types a question in the frontend chatbox → the backend turns that question into a vector → looks up the most relevant chunks of your own documents in Pinecone → hands those chunks to an LLM along with the question → returns a grounded answer plus the sources it used.

```
Next.js chatbox
      │  POST /chat { message, history }
      ▼
 EmbeddingsService  →  turns the question into a 384-dim vector (local, no API call)
      │
      ▼
 PineconeService    →  finds the most similar stored chunks (semantic search)
      │
      ▼
 LlmService         →  sends the question + retrieved chunks + system prompt to Groq
      │
      ▼
 { answer, sources } back to the frontend
```

Before any of this is useful, your own content needs to be loaded into Pinecone once via `POST /ingest`.

## The parts

### `/chat` — the chatbox endpoint

This is what the frontend calls on every message. It takes the user's `message` (and optionally recent `history` for multi-turn context), and returns `{ answer, sources }`. Internally it's just gluing the three services below together: embed the question, retrieve matching context, ask the LLM. This is the only endpoint the frontend chatbox needs to know about.

### `/ingest` — loading your knowledge base

Before the chatbox can answer anything useful, it needs data to search over. `/ingest` takes raw text documents, splits each into smaller overlapping chunks (so retrieval can point at a specific paragraph instead of a whole document), embeds each chunk, and stores the vectors in Pinecone alongside the original text and any metadata you attach. You'd typically call this once per document (or re-run it whenever your source content changes) — not something the frontend chatbox calls directly.

### `/health` — uptime check

Returns `{ status: "ok" }`. Used by Render (and any uptime monitor) to check the service is alive. No logic beyond that.

### Embeddings — turning text into vectors

Handled by a local, in-process model (`Xenova/all-MiniLM-L6-v2`, via `@xenova/transformers`) rather than an external API. It converts any piece of text — a question or a document chunk — into a 384-number vector that captures its meaning, so semantically similar text ends up close together in vector space. Running this locally means no extra API key, no per-call cost, and it's quantized small enough (~25MB) to run inside Render's free-tier memory limits. Both `/chat` and `/ingest` use this same service, which is why the vectors are comparable to each other.

### Pinecone — the vector database

This is where all your document chunks live as vectors, plus their original text and metadata. `/ingest` writes to it; `/chat` reads from it (a similarity search: "give me the N chunks whose vectors are closest to this question's vector"). Pinecone is fully hosted, so the backend itself stays stateless — nothing about your knowledge base is stored on the server.

### LLM — generating the answer

This is the only part of the pipeline that calls an external AI model for text generation (as opposed to embeddings, which run locally). It's wired up for Groq's free, OpenAI-compatible API by default, but works with OpenAI or any other OpenAI-compatible provider by changing two env vars. This is also where the **system prompt** lives — the instructions that tell the model to only answer from the retrieved context, stay concise, and cite sources. Editing that one prompt is the main way students should customize how the bot behaves.

### Config — environment-driven settings

Everything that differs between local development and a deployed instance (API keys, which Pinecone index/namespace to use, which LLM model, allowed frontend origin, how many chunks to retrieve) is read from environment variables in one place, rather than scattered across the code. Nothing sensitive is hardcoded.

## Why this stack fits Render's free tier

Render's free web services have ~512MB RAM, shared CPU, and spin down after 15 minutes of inactivity. Running a full embedding model *and* an LLM locally would not fit that budget. This boilerplate splits the work:

- The **embedding model runs locally** (small, quantized, fits in 512MB RAM) — free forever, no external embedding API needed.
- The **LLM call is offloaded to Groq's API** — no heavy generative model loaded in-process, and Groq's free tier means no LLM cost either.
- Cold starts: the free instance sleeps when idle, and the embedding model is downloaded once from Hugging Face on first boot (kept in memory after that). Expect the *first* request after a cold start to be slow (10–30s); requests after that are fast.

## Customizing the prompting layer

The system prompt lives in [`src/llm/llm.service.ts`](src/llm/llm.service.ts) (`buildSystemPrompt`). This is where you'd add persona, tone, output-format, or guardrail instructions — it's intentionally kept in one place, separate from retrieval and the API wiring, so it's the first thing to edit when adapting this boilerplate to a new project.

## Things to swap out for a real project

- Chunking in `ingestion.service.ts` is a naive fixed-size splitter — swap for sentence/paragraph-aware chunking as your content needs grow.
- No auth is included on `/ingest` or `/chat` — add a guard (API key header, JWT, etc.) before exposing this publicly, since both endpoints trigger paid-adjacent calls (Pinecone, Groq).
- No conversation persistence — `history` is passed from the frontend on every request; add a database if you want server-side chat history instead.
