# Build Vite SPA
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

# Production: Express serves API + dist + writable support markdown
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787
ENV HOST=0.0.0.0

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY public ./public
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
COPY public/support /app/docker/support-seed
COPY --from=build /app/dist ./dist

RUN chmod +x /app/docker/entrypoint.sh \
  && addgroup -S airepro && adduser -S airepro -G airepro \
  && chown -R airepro:airepro /app/public/support /app/docker

USER airepro

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
