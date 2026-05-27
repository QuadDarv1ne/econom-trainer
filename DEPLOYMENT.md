# Deployment Guide

This guide covers deploying EconTrainer to various platforms. The application is a Next.js 16 full-stack app with SQLite/PostgreSQL/MySQL support, authentication, and PWA capabilities.

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** / **pnpm** / **yarn**
- A database (SQLite for single-file, PostgreSQL or MySQL for multi-user)

---

## Quick Deploy Buttons

| Platform | Database | Difficulty |
|----------|----------|------------|
| [Vercel](#1-vercel-recommended) | PostgreSQL (Neon/Supabase) | Easy |
| [Railway](#2-railway) | PostgreSQL (built-in) | Easy |
| [Render](#3-render) | PostgreSQL (built-in) | Easy |
| [Fly.io](#4-flyio) | SQLite or PostgreSQL | Medium |
| [Docker / VPS](#5-docker--vps) | Any | Medium |
| [Manual VPS + nginx](#6-manual-vps--nginx) | Any | Hard |

---

## 1. Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps. The project is already optimized for Vercel.

### Steps

1. **Push your code to GitHub**

2. **Go to [vercel.com](https://vercel.com)** → Import your repository

3. **Set environment variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | PostgreSQL URL from [Neon](https://neon.tech) or [Supabase](https://supabase.com) |
| `AUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (optional, for email) |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `TRUST_PROXY` | `true` |

4. **Deploy** — Vercel will automatically build and deploy

### Notes

- Vercel does not support SQLite persistence — use PostgreSQL (Neon/Supabase free tier works)
- Serverless functions have a 10-second timeout; rate limiting is in-memory and resets on cold starts
- For custom domains: add in Vercel dashboard → Domains

---

## 2. Railway

Railway provides built-in PostgreSQL and easy deployment.

### Steps

1. **Create a project on [railway.app](https://railway.app)**

2. **Add a PostgreSQL database:**
   - New → Database → Add PostgreSQL
   - Copy the `DATABASE_URL` from the connection info

3. **Deploy the app:**
   - New → GitHub Repo → select `econom-trainer`
   - Go to Variables tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | From Railway PostgreSQL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | From resend.com (optional) |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `TRUST_PROXY` | `true` |

4. **Deploy** — Railway auto-detects Next.js and runs `npm run build`

### Notes

- Railway automatically sets `PORT` and URL variables
- Free tier includes $5/month credit
- Database persists across deployments

---

## 3. Render

Render offers free PostgreSQL and simple Git-based deployments.

### Steps

1. **Create a Web Service on [render.com](https://render.com)**

2. **Connect your GitHub repository**

3. **Configure:**
   - Build command: `npm install && npm run db:generate && npm run db:push && npm run build`
   - Start command: `npm start`
   - Node version: `20`

4. **Add a PostgreSQL database:**
   - New → PostgreSQL
   - Copy the internal connection URL

5. **Set environment variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | From Render PostgreSQL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | From resend.com (optional) |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `TRUST_PROXY` | `true` |

### Notes

- Free tier: web services sleep after 15 min of inactivity
- PostgreSQL free tier: 1 GB storage, 90-day retention

---

## 4. Fly.io

Fly.io runs Docker containers globally. Good for low-latency worldwide deployment.

### Steps

1. **Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/):**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Initialize:**
   ```bash
   fly launch --name econom-trainer
   ```

3. **Add PostgreSQL (optional, or use SQLite with persistent volume):**
   ```bash
   fly postgres create --name econom-db
   fly postgres attach --postgres-app econom-db
   ```

4. **Set secrets:**
   ```bash
   fly secrets set AUTH_SECRET="$(openssl rand -base64 32)"
   fly secrets set RESEND_API_KEY="re_xxx"
   fly secrets set EMAIL_FROM="noreply@yourdomain.com"
   fly secrets set TRUST_PROXY="true"
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

### Notes

- If using SQLite, add a persistent volume: `fly volumes create data --size 1`
- Free allowance: 3 shared-CPU VMs, 3 GB persistent volume total

---

## 5. Docker / VPS

The app is configured with `output: "standalone"` for Docker deployment.

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Set correct permissions for SQLite database
RUN mkdir -p /app/prisma
RUN chown nextjs:nodejs /app/prisma

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Build and Run

```bash
# Build
docker build -t econom-trainer .

# Run with SQLite (persistent volume for database)
docker run -d \
  --name econom-trainer \
  -p 3000:3000 \
  -v econom-data:/app/prisma \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e DATABASE_URL="file:/app/prisma/dev.db" \
  -e TRUST_PROXY="true" \
  econom-trainer

# Run with PostgreSQL
docker run -d \
  --name econom-trainer \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/econom" \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e TRUST_PROXY="true" \
  econom-trainer
```

### docker-compose.yml

For app + PostgreSQL in one command:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://econom:secretpass@db:5432/econom
      - AUTH_SECRET=change-me-generate-with-openssl-rand-base64-32
      - TRUST_PROXY=true
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=econom
      - POSTGRES_PASSWORD=secretpass
      - POSTGRES_DB=econom
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

```bash
docker compose up -d --build
```

---

## 6. Manual VPS + nginx

For full control, deploy behind nginx reverse proxy with SSL.

### Server Setup (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and build
git clone https://github.com/QuadDarv1ne/econom-trainer.git
cd econom-trainer
npm install
npm run db:generate
npm run db:push
npm run build
```

### systemd Service

Create `/etc/systemd/system/econom-trainer.service`:

```ini
[Unit]
Description=EconTrainer Next.js App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/econom-trainer
ExecStart=/usr/bin/node /opt/econom-trainer/.next/standalone/server.js
Environment=NODE_ENV=production
Environment=DATABASE_URL="file:/opt/econom-trainer/prisma/dev.db"
Environment=AUTH_SECRET="your-secret-here"
Environment=TRUST_PROXY=true
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable econom-trainer
sudo systemctl start econom-trainer
sudo systemctl status econom-trainer
```

### nginx Config

Create `/etc/nginx/sites-available/econom-trainer`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL is configured)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase body size for progress import/export
    client_max_body_size 10M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/econom-trainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string |
| `AUTH_SECRET` | Yes | — | JWT signing secret (32+ bytes base64) |
| `NEXTAUTH_URL` | Production | — | Full URL of your deployment |
| `NEXT_PUBLIC_URL` | Production | — | Full URL (client-side) |
| `NEXT_PUBLIC_APP_URL` | Production | — | Full URL (client-side) |
| `RESEND_API_KEY` | Optional | — | Email service API key |
| `EMAIL_FROM` | Optional | — | Sender email address |
| `TRUST_PROXY` | Behind proxy | `false` | Set `true` behind nginx/Cloudflare |

### Generating AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Production Checklist

Before going live, verify:

- [ ] `AUTH_SECRET` is a strong random value (not the dev default)
- [ ] `DATABASE_URL` points to a persistent database (not local dev.db)
- [ ] `NEXTAUTH_URL` / `NEXT_PUBLIC_URL` match your actual domain
- [ ] HTTPS is enabled (Let's Encrypt or platform-provided)
- [ ] `TRUST_PROXY=true` if behind a reverse proxy or CDN
- [ ] Database migrations are applied (`npm run db:push` or `npm run db:migrate`)
- [ ] Email service is configured (for password reset)
- [ ] Rate limiting works (test with multiple rapid requests)
- [ ] Backups are configured for your database
- [ ] Monitoring/logging is set up (e.g., Vercel logs, Railway logs)

---

## Troubleshooting

### "Error: Could not find Prisma Client"

Run `npm run db:generate` before building.

### "Database not found" on first deploy

Run `npm run db:push` to create tables from the schema.

### Sessions don't persist across deployments

Ensure `AUTH_SECRET` is set as a persistent environment variable (not regenerated each deploy).

### Rate limiting doesn't work behind nginx

Set `TRUST_PROXY=true` so the app reads `X-Forwarded-For` instead of the proxy IP.

### Email verification link is broken

Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_URL` are set to your actual domain (not localhost).
