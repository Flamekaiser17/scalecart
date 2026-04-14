# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy built code
COPY --from=builder /app/dist ./dist

# Optionally copy .env if you want to bake it in (not recommended for secrets)
# COPY .env ./

EXPOSE 8000

CMD ["npm", "start"] 