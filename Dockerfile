# syntax=docker/dockerfile:1

# ---------- dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` from the lockfile keeps the image reproducible.
RUN npm ci --omit=dev

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    ENVIRONMENT=production \
    SERVER_PORT=3000

WORKDIR /app

# `node` (uid 1000) ships with the base image; run as it rather than root.
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node app.js server.js ./
COPY --chown=node:node config ./config
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node dal ./dal
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node models ./models
COPY --chown=node:node routes ./routes
COPY --chown=node:node schemas ./schemas
COPY --chown=node:node services ./services
COPY --chown=node:node utils ./utils

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.SERVER_PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# No npm in the entrypoint: node is PID 1, so SIGTERM reaches the app directly
# and server.js can close the HTTP server and the mongoose connection cleanly.
CMD ["node", "server.js"]
