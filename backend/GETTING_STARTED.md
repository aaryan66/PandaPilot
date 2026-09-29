# Getting Started

Step-by-step setup, from cloning the repo to getting your first chat response back. For an explanation of what each part of the backend does, see [README.md](README.md).

## 1. Clone and install

```bash
git clone <your-repo-url>
cd rag-backend
npm i
```

## 2. Set up environment variables

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and fill in the following (the placeholders explain where each value comes from):

| Variable | Where to get it |
|---|---|
| `OPENAI_API_KEY` | A Groq API key from [console.groq.com/keys](https://console.groq.com/keys) (free tier) |
| `PINECONE_API_KEY` | From your Pinecone project — see step 3 below |
| `PINECONE_INDEX` | The index name you create in step 3 |
| `FRONTEND_ORIGIN` | Your Next.js app's URL, e.g. `http://localhost:3000` |

Leave `OPENAI_BASE_URL`, `OPENAI_MODEL`, `PINECONE_NAMESPACE`, `EMBEDDING_MODEL`, and `TOP_K` as their defaults unless you have a reason to change them.

## 3. Create a Pinecone index (384 dimensions)

The local embedding model this backend uses (`Xenova/all-MiniLM-L6-v2`) outputs 384-dimensional vectors, so the Pinecone index **must** be created with matching dimensions or every request will fail.

1. Sign up / log in at [app.pinecone.io](https://app.pinecone.io).
2. Click **Create Index**.
3. Set:
   - **Name**: anything, e.g. `rag-boilerplate` (put this in `PINECONE_INDEX` in your `.env`)
   - **Dimensions**: `384`
   - **Metric**: `cosine`
4. Once created, go to **API Keys** in your Pinecone project and copy the key into `PINECONE_API_KEY` in `.env`.

## 4. Start the server

```bash
npm run start:dev
```

You should see logs ending in something like:

```
RAG backend listening on port 3001
API docs available at http://localhost:3001/api/docs
Embedding model ready
```

The first boot downloads the embedding model, so it may take a few extra seconds — that's expected and only happens once.

Verify it's up:

```bash
curl http://localhost:3001/health
```

should return `{"status":"ok"}`.

### Alternative: running with Docker

Instead of `npm run start:dev`, you can build and run the provided `Dockerfile` (this is also how Render can deploy it):

```bash
docker build -t rag-backend .
docker run -p 3001:3001 --env-file .env rag-backend
```

## 5. Open the API docs

Go to:

```
http://localhost:3001/api/docs
```

This is an interactive Swagger UI listing `/chat`, `/ingest`, and `/health`, with example request/response bodies and a "Try it out" button for each — you can do everything in the next two steps directly from this page instead of using `curl`.

## 6. Ingest some data

Before the chatbox can answer anything, Pinecone needs content to search over. Send one or more documents to `/ingest` — either via the Swagger UI's "Try it out" on `POST /ingest`, or:

```bash
curl -X POST http://localhost:3001/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc-1",
        "text": "NestJS is a progressive Node.js framework for building efficient, scalable server-side applications.",
        "metadata": { "title": "Intro" }
      }
    ]
  }'
```

A successful response looks like:

```json
{ "chunksIndexed": 1 }
```

## 7. Chat

Now ask a question about what you just ingested — via Swagger's "Try it out" on `POST /chat`, or:

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{ "message": "What is NestJS?" }'
```

Expected response shape:

```json
{
  "answer": "NestJS is a progressive Node.js framework for building efficient, scalable server-side applications [1].",
  "sources": [
    { "id": "doc-1-0", "score": 0.83, "text": "...", "metadata": { "title": "Intro" } }
  ]
}
```

If you get a `500` here, double check `OPENAI_API_KEY` and `PINECONE_API_KEY`/`PINECONE_INDEX` are filled in correctly in `.env` and the server was restarted after editing it.

## 8. Connect the Next.js frontend

In your Next.js app, point the chatbox at this backend:

```ts
// e.g. app/lib/chat.ts
export async function sendMessage(message: string, history: { role: 'user' | 'assistant'; content: string }[]) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json() as Promise<{ answer: string; sources: unknown[] }>;
}
```

Set `NEXT_PUBLIC_BACKEND_URL` in the frontend's env to this backend's URL. Make sure `FRONTEND_ORIGIN` in this backend's `.env` matches the frontend's URL (comma-separated if there's more than one, e.g. local + deployed), otherwise the browser will block the request via CORS.

## 9. Deploying to Render

1. Push this project to a Git repo (or a subdirectory of one, setting Render's "Root Directory" to it).
2. Create a new Web Service on Render and connect the repo.
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Plan: Free
3. Add the environment variables from `.env.example` in Render's dashboard (or use the included `render.yaml` as a Blueprint).
4. Set `FRONTEND_ORIGIN` to your deployed frontend's URL, and update `NEXT_PUBLIC_BACKEND_URL` in the frontend to this Render service's URL.

### If deploying the frontend on Vercel

Vercel gives you two kinds of URLs:
- A **stable production domain** (Project → Settings → Domains, looks like `https://your-app.vercel.app`) — always points at your latest production deploy.
- A **preview URL per deployment** (looks like `https://your-app-<random-hash>-<team>.vercel.app`) — a **new one every time you push**, e.g. for PR previews.

Use the stable production domain for `FRONTEND_ORIGIN` normally. If you also need preview deployments to work, add a wildcard pattern (`*` matches anything) alongside it — this backend's CORS config supports it:

```
FRONTEND_ORIGIN=https://your-app.vercel.app,https://your-app-*-your-team.vercel.app
```

**Common symptom if this is misconfigured**: in the browser's Network tab, the `OPTIONS /chat` preflight still shows `204 No Content` (that always "succeeds"), but the actual `POST /chat` is blocked by the browser and never completes — check for a missing `Access-Control-Allow-Origin` header on the OPTIONS response, or check Render's logs for a `[CORS] Rejected request from origin "..."` line, which tells you exactly what to add to `FRONTEND_ORIGIN`.
