FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
COPY apps/telegram-bot/ ./apps/telegram-bot/

RUN npm install
RUN npm run build:packages
RUN npm run build:bot

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/telegram-bot/package*.json ./apps/telegram-bot/
COPY --from=builder /app/apps/telegram-bot/dist ./apps/telegram-bot/dist

RUN npm install --omit=dev

CMD ["node", "apps/telegram-bot/dist/index.js"]
