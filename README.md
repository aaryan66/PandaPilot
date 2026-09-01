# PandaPilot

A RAG-powered chatbot that answers questions about the [pandas](https://pandas.pydata.org/) Python library, grounded in its official documentation.

> ⚠️ **Project status: In progress.** This repo currently contains the knowledge base source data and initial ingestion script. The n8n RAG pipeline, frontend chat UI, and deployment are in development.

## Overview

PandaPilot aims to be an AI copilot for pandas — instead of relying on an LLM's general knowledge (which can be outdated or subtly wrong about specific APIs), it retrieves relevant sections from pandas' actual documentation and generates answers grounded in that content, with sources cited.

## Planned Architecture

- **Orchestration:** n8n (Cloud)
- **Vector database:** Pinecone (free tier)
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Generation:** OpenAI chat completion
- **Frontend:** Next.js chat interface
- **Deployment:** Vercel (frontend) + n8n Cloud (RAG pipeline)

## Current Contents

```
pandapilot/
├── pandas_docs/     # Source documentation (.rst files) pulled from pandas-dev/pandas,
│                     # used as the knowledge base for retrieval
└── main.py           # Script to download the pandas documentation from GitHub
```

### `pandas_docs/`
Contains `.rst` files from pandas' official [user guide](https://github.com/pandas-dev/pandas/tree/main/doc/source/user_guide) — covering topics like `groupby`, `merging`, `indexing`, `missing_data`, `timeseries`, and more. This will be chunked, embedded, and stored in Pinecone as the chatbot's knowledge base.

### `main.py`
Fetches pandas documentation files from the official GitHub repository via the GitHub Contents API and saves them locally for ingestion.

## Roadmap

- [x] Source and download pandas documentation
- [x] Build n8n ingestion workflow (chunk → embed → upsert to Pinecone)
- [x] Build n8n query workflow (retrieve → generate → return answer with sources)
- [ ] Build Next.js frontend chat interface
- [ ] Connect frontend to n8n webhook
- [ ] Deploy frontend (Vercel) and finalize n8n Cloud workflows
- [ ] Add example questions and source citation display in UI
- [ ] Final README with setup instructions and live demo link

## License

MIT