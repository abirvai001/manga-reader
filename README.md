# MangaFlow

A modern **manga reading web app** that turns standard **PDF files** into a native, smooth reader experience — no browser PDF chrome, toolbars, or download UI. Built for seamless UX and **sitewide banner ad monetization**.

## Stack

| Layer | Tech |
|--------|------|
| Framework | **Next.js 16** (App Router) + TypeScript |
| Styling | **Tailwind CSS 4** |
| PDF rendering | **react-pdf** / PDF.js → canvas pages |
| Backend | **Supabase** (Auth, Postgres, Storage) |
| Demo mode | Works out of the box with mock data (no Supabase required) |

## Features

### Custom manga viewer (`/manga/[id]`)
- Renders each PDF page as a **canvas** (not iframe / embed)
- **Continuous vertical scroll** (Webtoon style)
- **Single** and **double page** turn modes
- Lazy-loading via IntersectionObserver
- Zoom, fullscreen, keyboard navigation
- Sticky top/bottom ad slots while reading
- Inline ads every **5 pages** in vertical mode

### Sitewide ads
Reusable `AdBanner` component keyed by `placement_zone`:

| Zone | Where |
|------|--------|
| `homepage_top` | Homepage header |
| `homepage_bottom` | Homepage footer |
| `listing_top` | Browse page top |
| `sidebar` | Browse sidebar |
| `viewer_top` | Reader sticky top |
| `viewer_bottom` | Reader sticky bottom |
| `viewer_inline` | Between pages (vertical mode) |

Empty zones **collapse** — no blank reserved space.

### Admin panel (`/admin`)
- Auth (Supabase email/password; demo accepts any credentials)
- Upload manga PDF + cover
- Manage categories
- Upload / toggle / delete ad banners (PNG, JPG, GIF)

## Quick start

```bash
cd manga-reader
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo library and ads load automatically when Supabase env vars are missing.

## Supabase setup (production)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` → `.env.local` and fill:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run `supabase/schema.sql` in the SQL Editor.
4. Create **public** storage buckets: `pdfs`, `covers`, `ads`.
5. Enable storage policies (public read, authenticated write) as commented in the schema file.
6. Create an admin user under **Authentication → Users**.

## Project structure

```
src/
  app/                 # Routes (home, browse, manga reader, admin, APIs)
  components/
    ads/               # AdBanner
    layout/            # Header, Footer
    manga/             # Cards & grid
    viewer/            # PDF canvas reader
    admin/             # Admin UI pieces
  lib/
    data.ts            # Manga / ads queries (Supabase + mock fallback)
    types.ts
    mock-data.ts
    supabase/          # Browser + server clients
supabase/
  schema.sql           # Tables, RLS, seed categories
```

## Scripts

```bash
npm run dev      # Development
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## License

MIT — use freely for your own manga platforms and ad inventory.
