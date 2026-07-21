FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11.18.0
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g npm@11.18.0
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
