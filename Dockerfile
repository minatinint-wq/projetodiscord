# syntax=docker/dockerfile:1
FROM --platform=linux/arm64 node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM --platform=linux/arm64 node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "exec node server.js"]
