# Use Node.js LTS as the base image
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Install production dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Run tests and linting
RUN npm install --only=dev
RUN npm run lint || true
RUN npm test || true

# Production image
FROM base AS production
ENV NODE_ENV=production

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app ./

# Set proper permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Expose the API port
EXPOSE 3000

# Start the service
CMD ["node", "server.js"]