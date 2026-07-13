# YourManga.EN — Production setup (Supabase + Vercel)

## Status check

Your Vercel project already has env var **names** for Supabase, but the **values are empty**.  
You must paste real keys once.

## 1. Get keys from Supabase (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Open your project (or **New project** if you don’t have one)
3. Go to **Project Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret — local setup only)

## 2. Run the database schema

1. Supabase → **SQL Editor → New query**
2. Paste the full contents of `supabase/schema.sql`
3. Click **Run**

This creates tables, RLS, storage buckets (`pdfs`, `covers`, `ads`), and seed categories.

## 3. Create admin user

**Option A — Dashboard**

1. Supabase → **Authentication → Users → Add user**
2. Email: `abirodroid.admob@gmail.com` (or yours)
3. Password: choose a strong password (min 8 chars)
4. Auto Confirm User: **ON**

**Option B — Script**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=abirodroid.admob@gmail.com
ADMIN_PASSWORD=YourStrongPasswordHere

node scripts/setup-production.mjs
```

## 4. Set Vercel environment variables

[Vercel → manga-reader → Settings → Environment Variables](https://vercel.com/abirvai001s-projects/manga-reader/settings/environment-variables)

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_REF.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Production, Preview |

Remove empty placeholders first if needed, then re-add with real values.

**Do NOT** put `service_role` on Vercel (client-exposed risk if misused).

CLI alternative (from project folder):

```bash
# Remove empty vars
npx vercel env rm NEXT_PUBLIC_SUPABASE_URL production -y
npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production -y

# Add real values (you'll be prompted to paste)
echo "https://YOUR_REF.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "YOUR_ANON_KEY" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Same for preview
echo "https://YOUR_REF.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "YOUR_ANON_KEY" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

npx vercel --prod
```

## 5. Supabase Auth URL config

Supabase → **Authentication → URL Configuration**

- Site URL: `https://manga-reader-lac-three.vercel.app`
- Redirect URLs:  
  `https://manga-reader-lac-three.vercel.app/**`  
  `http://localhost:3000/**`

## 6. Verify

- Health: `https://manga-reader-lac-three.vercel.app/api/health`  
  → `"supabase": true`, `"demoMode": false`
- Admin: `/admin/login` with the user you created
- Upload a PDF + cover under **Admin → Manga**

## Admin password

There is **no default password**.  
Whatever you set when creating the Supabase Auth user **is** the admin password.

## Sponsorship

Footer contact: **abirodroid.admob@gmail.com**
