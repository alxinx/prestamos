# ==================== STAGE 1: dependencias base ====================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ==================== STAGE 2: desarrollo (nodemon + hot reload) ====================
FROM deps AS development
WORKDIR /app

COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ==================== STAGE 3: builder para producción ====================
FROM deps AS builder
WORKDIR /app

COPY . .
RUN npx prisma generate

# Solo dependencias de producción
RUN npm ci --only=production --ignore-scripts && npx prisma generate

# ==================== STAGE 4: imagen final de producción ====================
FROM node:22-alpine AS production
WORKDIR /app

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 -G nodejs

COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --chown=appuser:nodejs package*.json ./
COPY --chown=appuser:nodejs index.js ./
COPY --chown=appuser:nodejs src ./src

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "index.js"]
