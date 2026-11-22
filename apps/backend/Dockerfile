FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN npm install
RUN npm run build:packages
RUN npm run build:backend

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN npm install --omit=dev

EXPOSE 5000

CMD ["node", "apps/backend/dist/index.js"]
