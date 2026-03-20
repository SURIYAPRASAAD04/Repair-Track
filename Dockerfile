# ─── Baileys: No Chrome needed! Simple Node.js image ───
FROM node:20-slim

# Only need ca-certificates for HTTPS connections
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  git \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

COPY server/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

COPY server/ .

EXPOSE 5001

CMD ["node", "server.js"]
