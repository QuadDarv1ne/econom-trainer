# Deployment Guide

This guide covers deploying EconTrainer to 7 platforms. The application is a Next.js 16 full-stack app with SQLite/PostgreSQL/MySQL support, authentication, and PWA capabilities.

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** / **pnpm** / **yarn**
- A database (SQLite for single-file, PostgreSQL or MySQL for multi-user)

---

## Platform Comparison

| Platform | Database | Difficulty | Time | Cost | Best For |
|----------|----------|------------|------|------|----------|
| [Vercel + Supabase](#1-vercel--supabase) | PostgreSQL | Easy | 5 min | Free tier | Quick launch, zero ops |
| [Railway (SQLite)](#2-railway-with-sqlite) | SQLite | Easy | 3 min | $5/mo credit | Simple single-user deploy |
| [Render](#3-render) | PostgreSQL | Medium | 10 min | Free (sleep) | Git-based CI/CD |
| [VPS + Docker](#4-vps--docker) | Any | Medium | 30 min | VPS cost | Full control |
| [Docker Swarm](#5-docker-swarm) | PostgreSQL | Hard | 1-2 hrs | Cluster cost | High availability |
| [Netlify](#6-netlify) | External DB | Easy | 5 min | Free tier | Static + edge functions |
| [Yandex Cloud](#7-yandex-cloud) | PostgreSQL | Medium | 20 min | Pay-as-you-go | Russian users, low latency |

### Quick Selection Guide

| Criteria | Recommended Platform |
|----------|---------------------|
| Free, zero configuration | Vercel + Supabase |
| Fastest deploy | Railway (3 min) |
| Russian audience, low latency | Yandex Cloud |
| Full infrastructure control | VPS + Docker |
| High availability, scaling | Docker Swarm |
| Git-based auto-deploy | Render or Netlify |
| Single user, simplest setup | Railway with SQLite |

### Database Selection

| Scenario | Database | Why |
|----------|----------|-----|
| Personal use, < 10 users | SQLite | Zero config, single file, backups via file copy |
| Team use, 10-100 users | PostgreSQL | Concurrent writes, connections pooling |
| Production, 100+ users | PostgreSQL | Replication, backups, connection management |
| Vercel / serverless | PostgreSQL | SQLite doesn't persist on serverless filesystems |
| Docker single-container | SQLite | Volume-mounted, survives container restarts |

---

## 1. Vercel + Supabase

Vercel is the native platform for Next.js. Supabase provides free PostgreSQL.

### Step 1: Create Supabase Database

1. Go to [supabase.com](https://supabase.com) → New Project
2. Set project name, database password
3. Wait ~2 min for database to provision
4. Go to Project Settings → Database → Connection string → URI mode
5. Copy the connection string (replace `[YOUR-PASSWORD]`)

### Step 2: Deploy to Vercel

1. **Push code to GitHub**

2. Go to [vercel.com](https://vercel.com) → New Project → Import repository

3. **Set environment variables:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_URL` | `https://your-project.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
| `RESEND_API_KEY` | From [resend.com](https://resend.com) (optional) |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `TRUST_PROXY` | `true` |

4. Click **Deploy**

### Step 3: Initialize Database

After deploy, run database migration once:
```bash
# Install Vercel CLI
npm i -g vercel
vercel login
vercel link
vercel env pull .env.production
npx prisma db push
```

### Notes

- Vercel serverless functions have 10s timeout (Hobby) / 60s (Pro)
- In-memory rate limiting resets on cold starts
- Free tier: 100 GB bandwidth/month
- Custom domains: Vercel dashboard → Domains → Add

---

## 2. Railway (with SQLite)

Railway is the fastest deploy option — 3 minutes from zero to live.

### Steps

1. Go to [railway.app](https://railway.app) → New Project

2. **Deploy from GitHub:**
   - New → GitHub Repo → select `econom-trainer`

3. **Set variables** (Variables tab):

| Variable | Value |
|----------|-------|
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | `file:/app/prisma/dev.db` |
| `TRUST_PROXY` | `true` |

4. **Add a persistent volume for SQLite:**
   - New → Volume → Name: `sqlite-data`, Size: `1 GB`
   - Mount path: `/app/prisma`

5. **Configure build:**
   - Settings → Root Directory: (leave empty)
   - Build Command: `npm install && npm run db:generate && npm run db:push && npm run build`
   - Start Command: `npm start`

6. **Deploy** — Railway auto-detects Next.js

### Notes

- Free tier: $5/month credit
- SQLite with persistent volume survives container restarts
- Railway automatically sets `PORT` and URL variables
- For multi-user: replace SQLite with Railway PostgreSQL (New → Database → PostgreSQL)

---

## 3. Render

Render provides free PostgreSQL and Git-based auto-deploy.

### Steps

1. Go to [render.com](https://render.com) → New Web Service

2. **Connect your GitHub repository**

3. **Configure:**

| Setting | Value |
|---------|-------|
| Build command | `npm install && npm run db:generate && npm run db:push && npm run build` |
| Start command | `npm start` |
| Node version | `20` |

4. **Add PostgreSQL:**
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

- Free tier: web services sleep after 15 min inactivity
- PostgreSQL free tier: 1 GB storage, 90-day retention
- Auto-deploys on every git push to connected branch

---

## 4. VPS + Docker

Full control deployment with Docker. Works on any VPS (DigitalOcean, Hetzner, Timeweb, etc.).

### Prerequisites

- Ubuntu 22.04+ / Debian 12+ VPS
- Docker and Docker Compose installed

### Step 1: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Reconnect SSH session
```

### Step 2: Deploy

```bash
# Clone the repository
git clone https://github.com/QuadDarv1ne/econom-trainer.git
cd econom-trainer

# Edit docker-compose.yml — change AUTH_SECRET and passwords
nano docker-compose.yml

# Build and start
docker compose up -d --build

# Initialize database
docker compose exec app npx prisma db push
```

### Step 3: Add nginx + SSL (optional)

```bash
# Install nginx
sudo apt install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/econom-trainer << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

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

    client_max_body_size 10M;
}
EOF

sudo ln -s /etc/nginx/sites-available/econom-trainer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Notes

- Update: `git pull && docker compose up -d --build`
- Logs: `docker compose logs -f --tail=50`
- SQLite persists in Docker volume; for PostgreSQL use the included `db` service

---

## 5. Docker Swarm

For high-availability deployments with multiple nodes.

### Prerequisites

- 2+ servers (1 manager + 1+ workers)
- Docker installed on all nodes
- Shared storage (NFS) for SQLite or external PostgreSQL

### Step 1: Initialize Swarm

On manager node:
```bash
docker swarm init --advertise-addr <MANAGER-IP>

# Join workers (run output from above command on each worker)
docker swarm join-token worker
```

### Step 2: Create Overlay Network

```bash
docker network create --driver overlay econom-net
```

### Step 3: Create Secrets

```bash
echo "your-auth-secret-here" | docker secret create auth_secret -
echo "your-db-password-here" | docker secret create db_password -
```

### Step 4: Deploy Stack

Create `docker-stack.yml`:

```yaml
version: '3.8'

services:
  app:
    image: econom-trainer:latest
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
      update_config:
        parallelism: 1
        delay: 30s
    environment:
      - DATABASE_URL=postgresql://econom:secretpass@db:5432/econom
      - TRUST_PROXY=true
    secrets:
      - auth_secret
    networks:
      - econom-net
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    environment:
      - POSTGRES_USER=econom
      - POSTGRES_DB=econom
    secrets:
      - db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - econom-net

volumes:
  postgres-data:

secrets:
  auth_secret:
    external: true
  db_password:
    external: true

networks:
  econom-net:
    external: true
```

```bash
# Build image on manager
docker build -t econom-trainer:latest .

# Deploy
docker stack deploy -c docker-stack.yml econom

# Check status
docker stack services econom
docker service ps econom_app
```

### Rolling Updates

```bash
# Rebuild and redeploy
docker build -t econom-trainer:latest .
docker service update --image econom-trainer:latest --update-parallelism 1 --update-delay 30s econom_app

# Rollback if something goes wrong
docker service update --rollback econom_app
```

### Notes

- Use external PostgreSQL for production Swarm (not the included service)
- Consider pgpool-II or PGBouncer for connection pooling
- For zero-downtime deploys: use `update_config` with `order: start-first`

---

## 6. Netlify

Netlify supports Next.js через Edge Functions + adapter.

### Steps

1. **Install Netlify adapter:**
   ```bash
   npm install -D @netlify/next
   ```

2. **Create `netlify.toml`:**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

3. **Deploy:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - New site from Git → Connect repository
   - Build settings auto-detected from `netlify.toml`

4. **Set environment variables** in Netlify dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | External PostgreSQL URL |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-site.netlify.app` |
| `NEXT_PUBLIC_URL` | `https://your-site.netlify.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-site.netlify.app` |
| `RESEND_API_KEY` | From resend.com (optional) |
| `TRUST_PROXY` | `true` |

### Notes

- Netlify does **not** support SQLite — use external PostgreSQL (Neon/Supabase)
- Serverless functions have 10s timeout (free) / 26s (Pro)
- Free tier: 100 GB bandwidth, 300 build minutes/month
- Auto-deploys on git push
- Custom domains + free SSL included

---

## 7. Yandex Cloud

Best for Russian audience — lowest latency from Russia.

### Option A: Serverless Containers (easiest)

1. **Install YC CLI:**
   ```bash
   curl -sSL https://storage.yandexcloud.net/cli/install.sh | bash
   yc init
   ```

2. **Build and push to Container Registry:**
   ```bash
   yc cr registry create econom-trainer
   docker build -t cr.yandex/econom-trainer/app:latest .
   docker tag cr.yandex/econom-trainer/app:latest
   docker push cr.yandex/econom-trainer/app:latest
   ```

3. **Create Serverless Container:**
   ```bash
   yc serverless container create \
     --name econom-trainer \
     --container cr.yandex/econom-trainer/app:latest \
     --memory 512m \
     --core-fraction 100 \
     --env AUTH_SECRET="your-secret" \
     --env DATABASE_URL="postgresql://..." \
     --env TRUST_PROXY=true \
     --service-account-name default
   ```

4. **Create API Gateway:**
   ```bash
   yc serverless api-gateway create --name econom-gw
   # Add spec.yml with route to container
   ```

### Option B: Compute Cloud VM (full control)

1. **Create VM:**
   ```bash
   yc compute instance create \
     --name econom-trainer \
     --platform standard-v1 \
     --cores 2 --memory 4G \
     --create-boot-disk size=20,image-folder-id=standard-images,image-family=ubuntu-2204-lts \
     --public-ip \
     --ssh-key ~/.ssh/id_rsa.pub
   ```

2. **SSH and deploy:**
   ```bash
   ssh yc-user@<VM-IP>
   curl -fsSL https://get.docker.com | sh
   git clone https://github.com/QuadDarv1ne/econom-trainer.git
   cd econom-trainer
   docker compose up -d --build
   docker compose exec app npx prisma db push
   ```

3. **Add managed PostgreSQL (optional):**
   ```bash
   yc mdb postgresql create \
     --name econom-db \
     --environment production \
     --network-name default \
     --user name=econom,password=secretpass \
     --db name=econom \
     --resource-class hobby \
     --storage-size 10
   ```

### Notes

- Serverless Containers: pay per invocation + memory time
- Compute Cloud VM: from ~1500 RUB/month for 2 CPU / 4 GB
- Managed PostgreSQL: from ~2000 RUB/month
- All traffic within Russia stays on Yandex infrastructure
- Free SSL via Let's Encrypt on VM; Serverless Containers get `.execute-api.ru` domain

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `file:./dev.db` or `postgresql://...` |
| `AUTH_SECRET` | JWT signing secret (32+ bytes) | `openssl rand -base64 32` |

### Required for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Full deployment URL | `https://myapp.vercel.app` |
| `NEXT_PUBLIC_URL` | Full URL (client-side) | `https://myapp.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Full URL (client-side) | `https://myapp.vercel.app` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Email service (password reset) | — |
| `EMAIL_FROM` | Sender email | — |
| `TRUST_PROXY` | Trust X-Forwarded-* headers | `false` |

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

---

## SQLite vs PostgreSQL

### When to Use SQLite

- Single user or < 10 concurrent users
- Personal learning instance
- Docker single-container deployment with volume
- Railway with persistent volume
- Simple backup (copy one file)

### When to Use PostgreSQL

- Multiple concurrent users
- Vercel / Netlify / serverless deployments
- Need connection pooling
- Production with backup/replication requirements
- Docker Swarm (multiple app instances)

### Migrating SQLite → PostgreSQL

1. **Export from SQLite:**
   ```bash
   npx prisma db pull --url "file:./dev.db"
   # Or use sqlite3 to dump:
   sqlite3 prisma/dev.db ".dump" > backup.sql
   ```

2. **Switch DATABASE_URL:**
   ```bash
   # .env
   DATABASE_URL="postgresql://user:pass@host:5432/econom"
   ```

3. **Generate and push:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Import data** (if you have a SQL dump):
   ```bash
   psql "postgresql://user:pass@host:5432/econom" < backup.sql
   ```

5. **Verify:**
   ```bash
   npx prisma studio
   ```

---

## Backups

### SQLite Manual Backup

```bash
# Copy the database file
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)

# Or use SQLite WAL-safe backup
sqlite3 prisma/dev.db ".backup 'prisma/dev.db.backup'"
```

### SQLite Automated Backup (cron)

```bash
# Add to crontab (crontab -e)
0 3 * * * cp /opt/econom-trainer/prisma/dev.db /opt/econom-trainer/backups/dev.db.$(date +\%Y\%m\%d).db
0 3 * * 0 find /opt/econom-trainer/backups -name "*.db" -mtime +30 -delete
```

### PostgreSQL Automated Backup

```bash
# Backup script
cat > /usr/local/bin/backup-econom-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" | gzip > /backups/econom-$DATE.sql.gz
# Keep last 7 days
find /backups -name "econom-*.sql.gz" -mtime +7 -delete
EOF
chmod +x /usr/local/bin/backup-econom-db.sh

# Cron: daily at 3 AM
echo "0 3 * * * /usr/local/bin/backup-econom-db.sh" | crontab -
```

### Docker Volume Backup

```bash
# Backup
docker run --rm -v econom-trainer_postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore
docker run --rm -v econom-trainer_postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```

---

## Monitoring

### Health Check

The app runs on `/` — check for HTTP 200:

```bash
curl -f http://localhost:3000 || echo "App is down!"
```

Add to `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

### Prometheus + Grafana

1. **Add metrics endpoint** (application-level):
   Create `src/app/api/metrics/route.ts`:
   ```ts
   import { NextResponse } from 'next/server';

   export async function GET() {
     return NextResponse.json({
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       timestamp: new Date().toISOString(),
     });
   }
   ```

2. **Prometheus config** (`prometheus.yml`):
   ```yaml
   scrape_configs:
     - job_name: 'econom-trainer'
       scrape_interval: 15s
       static_configs:
         - targets: ['localhost:3000']
       metrics_path: '/api/metrics'
   ```

3. **Grafana dashboard:**
   - Add Prometheus as data source
   - Import Node.js dashboard (ID: 11159)
   - Create custom panels for uptime, memory usage, response times

### Platform-native Monitoring

| Platform | Logging | Monitoring |
|----------|---------|------------|
| Vercel | `vercel logs` | Deployment metrics in dashboard |
| Railway | Logs tab | CPU/memory in Resources tab |
| Render | Logs tab | Dashboard metrics |
| Docker | `docker compose logs -f` | `docker stats` |
| Yandex Cloud | Logging service | Monitoring dashboard |

---

## CI/CD — GitHub Actions

### Build + Test on Push

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    env:
      DATABASE_URL: "file:./test.db"
      AUTH_SECRET: "test-secret-for-ci-not-for-production"

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npm run db:generate

      - name: Push database schema
        run: npm run db:push

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

### Auto-deploy to Vercel on Push

Create `.github/workflows/deploy-vercel.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

Required secrets in GitHub repo settings:
- `VERCEL_TOKEN` — from vercel.com → Settings → Tokens
- `VERCEL_ORG_ID` — from Vercel project settings
- `VERCEL_PROJECT_ID` — from Vercel project settings

### Auto-deploy to Docker Registry

Create `.github/workflows/docker.yml`:

```yaml
name: Build and Push Docker Image

on:
  push:
    tags: ['v*']

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.ref_name }}
```

---

## Deployment Checklist

Before going live:

- [ ] `AUTH_SECRET` is a strong random value (not dev default)
- [ ] `DATABASE_URL` points to persistent database
- [ ] `NEXTAUTH_URL` / `NEXT_PUBLIC_URL` match your domain
- [ ] HTTPS enabled (Let's Encrypt or platform-provided)
- [ ] `TRUST_PROXY=true` if behind reverse proxy/CDN
- [ ] Database migrations applied (`npm run db:push`)
- [ ] Email service configured (password reset)
- [ ] Rate limiting tested (multiple rapid requests)
- [ ] Backups configured (cron or platform-native)
- [ ] Monitoring/logging set up
- [ ] `.env` is in `.gitignore` (no secrets in repo)
- [ ] `NODE_ENV=production` set
- [ ] Error pages tested (404, 500)
- [ ] PWA manifest works (install prompt on mobile)
- [ ] CSP headers don't break functionality

---

## Troubleshooting

### "Error: Could not find Prisma Client"
Run `npm run db:generate` before building.

### "Database not found" on first deploy
Run `npm run db:push` to create tables from schema.

### Sessions don't persist across deployments
`AUTH_SECRET` must be a persistent environment variable, not regenerated each deploy.

### Rate limiting doesn't work behind nginx
Set `TRUST_PROXY=true` so the app reads `X-Forwarded-For` instead of the proxy IP.

### Email verification link is broken
`NEXTAUTH_URL` and `NEXT_PUBLIC_URL` must be set to your actual domain (not localhost).

### 504 Gateway Timeout on first load
Serverless cold start — the first request after deploy takes longer. Subsequent requests are fast.

### SQLite "database is locked" error
Multiple concurrent writes — switch to PostgreSQL or reduce concurrent users.

### Build fails with "JavaScript heap out of memory"
Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

---

## Rollback

### Vercel
- Dashboard → Deployments → click previous deployment → Set as Active

### Railway
- Dashboard → Deployments → click previous deployment → Restore

### Render
- Dashboard → Deploys → click previous → Rollback

### Docker / VPS
```bash
# Revert to previous git commit
git log --oneline  # find the commit hash
git reset --hard <hash>
docker compose up -d --build
```

### Docker Swarm
```bash
docker service update --rollback econom_app
```

### Netlify
- Dashboard → Deploys → click previous → Publish this deploy

---

## Need Help?

- Check logs: `docker compose logs -f` or platform dashboard
- Review environment variables (typos in `DATABASE_URL` are common)
- Verify database connectivity: `npx prisma studio`
- Test locally first: `npm run dev` → `npm run build` → `npm start`
