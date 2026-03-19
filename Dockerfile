# ─── Stage 1: Build ───
FROM node:20-slim AS builder

WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev

# ─── Stage 2: Production ───
FROM node:20-slim

# Install Chromium + required system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  ca-certificates \
  dbus \
  libgbm1 \
  libnss3 \
  libatk-bridge2.0-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm-dev \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  libatspi2.0-0 \
  libcups2 \
  fonts-liberation \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Tell Puppeteer to use the system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_OPTIONS="--max-old-space-size=384"

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy only the server code (not the client)
COPY server/ .

EXPOSE 5001

CMD ["node", "server.js"]
