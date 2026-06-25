# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src

COPY --from=frontend-builder /frontend/dist ./frontend/dist
RUN mkdir -p uploads

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD npx prisma db push --accept-data-loss && npx prisma db seed && node src/index.js
