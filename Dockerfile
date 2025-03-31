FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json files
COPY sim/package.json sim/package-lock.json* ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY sim/ ./

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for nextjs to access the files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Add database migrations and other necessary files
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts

# Create the .env file with default values
RUN echo "DATABASE_URL=postgres://postgres:postgres@postgres:5432/postgres" > .env
RUN echo "GEMINI_API_KEY=" >> .env
RUN echo "DATABASE_DIRECT_URL=postgres://postgres:postgres@postgres:5432/postgres" >> .env
RUN echo "NEXTAUTH_URL=http://localhost:3000" >> .env
RUN echo "NEXTAUTH_SECRET=secret" >> .env
RUN echo "GOOGLE_CLIENT_ID=" >> .env
RUN echo "GOOGLE_CLIENT_SECRET=" >> .env

# Switch to the non-root user
USER nextjs

# Expose the listening port
EXPOSE 3000

# Run migrations and start the app
CMD npx drizzle-kit push && npm run start