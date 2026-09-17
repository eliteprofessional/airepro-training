# Build Vite SPA
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Combined image (optional): Express serves API + SPA
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787
ENV HOST=0.0.0.0
ENV SERVE_FRONTEND=true

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY public ./public
COPY docker/entrypoint.sh /app/docker/entrypoint.sh
COPY public/training /app/docker/training-seed
COPY --from=build /app/dist ./dist

RUN chmod +x /app/docker/entrypoint.sh \
  && addgroup -S airepro && adduser -S airepro -G airepro \
  && chown -R airepro:airepro /app/public/training /app/docker

USER airepro

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
