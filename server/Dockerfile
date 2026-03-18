# Use official Node.js slim image (Debian-based)
FROM node:20-slim

# Install Chromium and required system libraries
RUN apt-get update && apt-get install -y \
  chromium \
  libgbm-dev \
  libnss3 \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libx11-xcb1 \
  fonts-liberation \
  wget \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Tell whatsapp-web.js / puppeteer-core where to find Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]
