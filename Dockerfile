FROM oven/bun:1.2-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    DATA_DIR=/app/data

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY config ./config
COPY src ./src
COPY assets ./assets

RUN mkdir -p /app/data && chown -R bun:bun /app

USER bun
VOLUME ["/app/data"]

CMD ["bun", "src/index.js"]
