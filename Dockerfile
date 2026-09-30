FROM node:22-slim AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm install
COPY web ./
RUN npm run build

FROM node:22-slim AS server
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server ./
RUN npm run build
COPY --from=web /web/dist /app/web/dist
RUN mkdir -p /data
ENV PORT=8080 DB_FILE=/data/salary.db WEB_DIST=/app/web/dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
