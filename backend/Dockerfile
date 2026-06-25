FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY ../frontend/package*.json ./
RUN npm ci
COPY ../frontend .
RUN npm run build

FROM node:20-alpine
WORKDIR /app/backend
COPY package*.json ./
RUN npm ci --only=production
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist
RUN mkdir -p uploads
EXPOSE 5000
CMD npx prisma db push --accept-data-loss --skip-generate && node src/index.js
