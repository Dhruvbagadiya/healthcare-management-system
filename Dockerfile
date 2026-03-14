# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies for the backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy the rest of the backend source code
COPY backend/. ./

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /usr/src/app

# We only need production dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Set ownership to non-root user
RUN chown -R nestjs:nodejs /usr/src/app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health/live || exit 1

# Command to run the application
CMD [ "npm", "run", "start:prod" ]
