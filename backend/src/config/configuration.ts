export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendOrigin: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, '')),

  llm: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.groq.com/openai/v1',
    model: process.env.OPENAI_MODEL ?? 'llama-3.1-8b-instant',
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    index: process.env.PINECONE_INDEX ?? 'rag-boilerplate',
    namespace: process.env.PINECONE_NAMESPACE ?? 'default',
  },

  embedding: {
    model: process.env.EMBEDDING_MODEL ?? 'Xenova/all-MiniLM-L6-v2',
  },

  retrieval: {
    topK: parseInt(process.env.TOP_K ?? '4', 10),
  },
});
