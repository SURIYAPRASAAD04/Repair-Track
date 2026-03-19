# ─── Stage 1: Build + Download compatible Chrome ───
FROM node:20-slim AS builder

WORKDIR /app

# Set puppeteer cache to a known location so we can copy it later
ENV PUPPETEER_CACHE_DIR=/app/.puppeteer-cache

COPY server/package*.json ./

# Install dependencies — puppeteer will auto-download its own compatible Chrome
RUN npm install --omit=dev

# ─── Stage 2: Production ───
FROM node:20-slim

# Install ALL system libs Chrome 127 needs to run (NOT chromium itself)
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

# Do NOT set PUPPETEER_EXECUTABLE_PATH — let puppeteer use its own Chrome
# Do NOT set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD — we want puppeteer's Chrome
ENV PUPPETEER_CACHE_DIR=/app/.puppeteer-cache
ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

# Copy node_modules from builder (includes whatsapp-web.js)
COPY --from=builder /app/node_modules ./node_modules

# Copy puppeteer's downloaded Chrome from builder
COPY --from=builder /app/.puppeteer-cache ./.puppeteer-cache

# Copy server code
COPY server/ .

EXPOSE 5001

CMD ["node", "server.js"]
