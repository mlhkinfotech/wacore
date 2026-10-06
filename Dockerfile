# Production Dockerfile for MLHK WhatsApp AI Server
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json .npmrc ./
COPY packages/ ./packages/
COPY plugins/ ./plugins/

RUN pnpm install --frozen-lockfile
RUN pnpm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/plugins/ ./plugins/
COPY --from=builder /app/node_modules/ ./node_modules/

EXPOSE 3001

CMD ["node", "packages/wa-server/dist/index.js"]
