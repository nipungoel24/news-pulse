# Multi-stage production Dockerfile for News Pulse
# Stage 1: Build the application
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build tooling)
RUN npm ci

# Copy application source and build configurations
COPY tsconfig.json vite.config.ts eslint.config.mjs ./
COPY src/ ./src/
COPY backend/ ./backend/
COPY scraper/ ./scraper/
COPY public/ ./public/
COPY migrations/ ./migrations/
COPY scripts/ ./scripts/

# Build production bundle with Nitro node-server preset
ENV NITRO_PRESET=node-server
RUN npm run build

# Copy PGLite data and wasm assets into .output/server/_libs/ so PGLite embedded fallback works when DATABASE_URL is not set
RUN cp node_modules/@electric-sql/pglite/dist/*.wasm node_modules/@electric-sql/pglite/dist/*.data .output/server/_libs/ 2>/dev/null || true

# Remove development dependencies
RUN npm prune --omit=dev

# Stage 2: Production runtime image containing Node.js 22 and Python 3
FROM node:22-bookworm-slim AS runner

# Install Python 3 (required for the scraper pipeline subprocess), curl for healthcheck, and ca-certificates for feed SSL
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Environment defaults (can be overridden by deployment platform)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV PYTHON_BIN=python3
ENV PYTHONIOENCODING=utf-8

# Copy production artifacts and dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/scraper ./scraper
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts

# Expose server port
EXPOSE 8080

# Health check using the lightweight health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-8080}/api/health || exit 1

# Start the standalone Nitro node server
CMD ["node", ".output/server/index.mjs"]
