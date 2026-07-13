/**
 * Production bootstrap for YourManga.EN
 *
 * Usage:
 *   node scripts/setup-production.mjs
 *
 * Requires in env (or .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (Dashboard → Settings → API → service_role)
 *   ADMIN_EMAIL                 (default: abirodroid.admob@gmail.com)
 *   ADMIN_PASSWORD              (required — set a strong password)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail =
  process.env.ADMIN_EMAIL || "abirodroid.admob@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;

function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

if (!url || url.includes("your-project") || !url.includes("supabase")) {
  fail(
    "Set NEXT_PUBLIC_SUPABASE_URL (e.g. https://xxxx.supabase.co) in .env.local"
  );
}
if (!serviceKey || serviceKey.length < 20) {
  fail(
    "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (Dashboard → Settings → API → service_role — keep secret)"
  );
}
if (!adminPassword || adminPassword.length < 8) {
  fail("Set ADMIN_PASSWORD (min 8 chars) in env for the admin user");
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const schemaPath = resolve(process.cwd(), "supabase/schema.sql");
const schema = readFileSync(schemaPath, "utf8");

async function runSql(sql) {
  // Prefer rpc exec if available; otherwise use PostgREST won't work for DDL.
  // Use management-style via pg meta is not available with service role alone.
  // We'll use the SQL via supabase.rpc if user created exec_sql; else split statements
  // and use the REST database URL is not exposed.
  //
  // Best path with service role: use fetch to PostgREST is limited.
  // Supabase JS has no direct SQL runner on free tier without database password.
  //
  // Fallback: use supabase.from for seed only and print SQL for user to run.
  console.log("ℹ️  Applying schema via Supabase SQL is best done in Dashboard.");
  console.log("   Writing schema path:", schemaPath);
  return { needsManualSql: true, sql };
}

async function ensureAdmin() {
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: adminPassword,
      email_confirm: true,
    });
    if (error) throw error;
    console.log("✅ Admin password reset for", adminEmail);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (error) throw error;
  console.log("✅ Admin user created:", adminEmail);
  return data.user.id;
}

async function seedCategories() {
  const cats = [
    { name: "Action", slug: "action" },
    { name: "Romance", slug: "romance" },
    { name: "Fantasy", slug: "fantasy" },
    { name: "Comedy", slug: "comedy" },
    { name: "Horror", slug: "horror" },
  ];
  for (const c of cats) {
    const { error } = await supabase.from("categories").upsert(c, {
      onConflict: "slug",
    });
    if (error && !String(error.message).includes("duplicate")) {
      console.warn("category seed:", c.slug, error.message);
    }
  }
  console.log("✅ Categories seeded (if tables exist)");
}

async function ensureBuckets() {
  const buckets = [
    {
      id: "pdfs",
      name: "pdfs",
      public: true,
      fileSizeLimit: 104857600,
      allowedMimeTypes: ["application/pdf"],
    },
    {
      id: "covers",
      name: "covers",
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    {
      id: "ads",
      name: "ads",
      public: true,
      fileSizeLimit: 3145728,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
    },
  ];

  const { data: existing } = await supabase.storage.listBuckets();
  const names = new Set((existing || []).map((b) => b.name));

  for (const b of buckets) {
    if (names.has(b.name)) {
      console.log("• bucket exists:", b.name);
      continue;
    }
    const { error } = await supabase.storage.createBucket(b.id, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes,
    });
    if (error) console.warn("bucket", b.name, error.message);
    else console.log("✅ created bucket:", b.name);
  }
}

async function main() {
  console.log("YourManga.EN production setup");
  console.log("Project:", url);

  await ensureBuckets();

  try {
    await seedCategories();
  } catch (e) {
    console.warn(
      "⚠️  Tables may not exist yet. Run supabase/schema.sql in SQL Editor first."
    );
    console.warn(String(e.message || e));
  }

  await ensureAdmin();

  console.log("\nNext steps:");
  console.log("1. If tables missing: open Supabase SQL Editor and run supabase/schema.sql");
  console.log("2. Set on Vercel:");
  console.log("   NEXT_PUBLIC_SUPABASE_URL=", url);
  console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from dashboard>");
  console.log("3. Redeploy. Login at /admin/login with:");
  console.log("  ", adminEmail);
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
