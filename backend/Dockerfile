FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy Prisma schema and generate
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Prune dev dependencies for production if needed, or stick to standard install.
# Since it's a backend, we can just keep the dependencies.

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy generated prisma and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src

# Expose port (Fly.io default exposes internal but we bind to 0.0.0.0:5000 in index.js)
EXPOSE 5000

# Set production env
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
