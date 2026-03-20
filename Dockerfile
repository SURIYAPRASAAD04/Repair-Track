# ─── Stage 1: Build + Download Chrome ───
FROM node:20-slim AS builder

WORKDIR /app

COPY server/package*.json ./

# Set puppeteer cache path — MUST match .puppeteerrc.cjs
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# Install deps — puppeteer postinstall will download its own compatible Chrome
RUN npm install --omit=dev

# ─── Stage 2: Production ───
FROM node:20-slim

# Install system libs Chrome needs (NOT chromium itself)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  dbus \
  libgbm1 \
  libnss3 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxfixes3 \
  libxext6 \
  libxkbcommon0 \
  libgbm-dev \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libatspi2.0-0 \
  libcups2 \
  libxshmfence1 \
  libdrm2 \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Cache path MUST match .puppeteerrc.cjs in server/
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
# Copy puppeteer's downloaded Chrome (path matches PUPPETEER_CACHE_DIR above)
COPY --from=builder /app/.cache ./.cache

COPY server/ .

EXPOSE 5001

CMD ["node", "server.js"]
