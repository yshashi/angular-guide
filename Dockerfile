# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY astro.config.mjs tsconfig.json ./
COPY src ./src
COPY public ./public
COPY skills ./skills
ENV PUBLIC_ASK_AI_ENDPOINT=/api/ask
RUN npm run build

FROM node:24-alpine AS api
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY --chown=node:node ai-backend/server.mjs ./ai-backend/server.mjs
COPY --from=build --chown=node:node /app/dist/llms-full.txt ./dist/llms-full.txt
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(async r => { const data = await r.json(); process.exit(r.ok && data.ok && data.chunks > 0 ? 0 : 1); }).catch(error => { console.error(error.message); process.exit(1); })"
CMD ["node", "ai-backend/server.mjs"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/health | grep -Eq '"chunks":[1-9][0-9]*'
