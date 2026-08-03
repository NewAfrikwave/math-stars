# Deploying Math Stars to Railway

Math Stars is a Next.js app that uses SQLite (via Prisma) for storage. Here's how to deploy it free-tier on Railway so families can use it.

## Quick deploy (5 minutes)

1. **Push to GitHub** — commit the whole project to a GitHub repo.

2. **Create a Railway project** — go to [railway.app](https://railway.app), click "New Project" → "Deploy from GitHub repo", and select your repo.

3. **Add a persistent volume** (so progress survives redeploys):
   - In your Railway service → **Settings** → **Volumes** → **Add Volume**
   - Mount path: `/app/data`
   - This is where the SQLite database lives.

4. **Set the database URL** — in Railway **Variables**, add:
   ```
   DATABASE_URL=file:/app/data/custom.db
   ```

5. **Deploy** — Railway auto-detects the `Dockerfile` and builds. The first deploy runs `prisma db push` to create the database tables automatically.

6. **Open it** — Railway gives you a URL like `https://math-stars.up.railway.app`. That's your live app! Share it with families.

## What Railway does automatically

- Builds the Docker image (Bun + Next.js standalone)
- Runs `prisma generate` during build
- Runs `prisma db push` on every boot (creates/migrates tables — safe, no data loss)
- Serves on the port Railway assigns (injected as `PORT`)

## Persistent data

The SQLite database file lives at `/app/data/custom.db` on a Railway volume. This means:
- ✅ Learner progress, profiles, and badges survive redeploys
- ✅ No external database to manage
- ⚠️ If you delete the volume, all data is lost

If you outgrow SQLite (many concurrent users), switch `DATABASE_URL` to a Railway Postgres URL and update `prisma/schema.prisma` provider to `"postgresql"`.

## Customizing donation handles

Edit `src/components/game/DonationsView.tsx` and change:
```ts
const CASHAPP_HANDLE = "$yourhandle";
const CASHAPP_URL = "https://cash.app/$yourhandle";
const ZELLE_INFO = "you@example.com";
```

## Cost

Railway's free trial gives you $5 of usage (~500 hours). After that, the Hobby plan is $5/month. SQLite + a single small service should stay well within that.

## Local development

```bash
bun install
bun run db:push    # create the local SQLite database
bun run dev        # start on http://localhost:3000
```
