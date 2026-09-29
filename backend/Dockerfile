# syntax=docker/dockerfile:1

# This backend depends on @xenova/transformers, which pulls in native
# binaries (onnxruntime-node, sharp) that ship prebuilt for glibc-based
# Linux. Using a slim Debian image (not Alpine/musl) avoids those packages
# falling back to a from-source build, which would need extra build tools
# and a much slower/larger image.

FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Production image ---
FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# The embedding model is downloaded from Hugging Face on first boot and
# cached here — needs to be writable by the non-root user below.
RUN mkdir -p .cache && chown -R node:node .cache

USER node

# Render provides PORT at runtime; 3001 matches this project's default.
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
