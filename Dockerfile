# Math Stars — Docker image for Railway deployment
# Uses Bun for fast installs and a multi-stage build to keep the image small.

FROM oven/bun:1 AS base
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json bun.lock* ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client (needs the schema)
RUN bunx prisma generate
# Build the Next.js standalone output
RUN bun run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a directory for the SQLite database (mounted as a Railway volume)
RUN mkdir -p /app/data

# Copy the standalone build + static assets + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# On first run, push the schema to create/migrate the SQLite database.
# The DATABASE_URL env var should point to /app/data/custom.db (persistent volume).
CMD ["sh", "-c", "bunx prisma@6.11.1 db push --accept-data-loss && bun server.js"]
