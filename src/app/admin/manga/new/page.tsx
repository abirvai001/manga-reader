"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  ImageIcon,
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { Category } from "@/lib/types";
import { createManga, uploadFile } from "@/lib/admin-actions";
import { checkStorageReady } from "@/lib/storage-client";
import { suggestMangaDescription } from "@/lib/seo";
import { hasSupabaseEnv } from "@/lib/env";

const STORAGE_SQL = `-- YourManga.EN storage fix — run ALL of this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pdfs', 'pdfs', true, 104857600, ARRAY['application/pdf']),
  ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('ads', 'ads', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "ym_public_read_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_public_read_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_public_read_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_insert_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_update_ads" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_covers" ON storage.objects;
DROP POLICY IF EXISTS "ym_auth_delete_ads" ON storage.objects;

CREATE POLICY "ym_public_read_pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'pdfs');
CREATE POLICY "ym_public_read_covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "ym_public_read_ads" ON storage.objects FOR SELECT USING (bucket_id = 'ads');

CREATE POLICY "ym_auth_insert_pdfs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_insert_covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
CREATE POLICY "ym_auth_insert_ads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads');

CREATE POLICY "ym_auth_update_pdfs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_update_covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "ym_auth_update_ads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'ads');

CREATE POLICY "ym_auth_delete_pdfs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pdfs');
CREATE POLICY "ym_auth_delete_covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "ym_auth_delete_ads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'ads');
`;

export default function NewMangaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [storageStatus, setStorageStatus] = useState<string>("Checking storage…");
  const [storageOk, setStorageOk] = useState(false);
  const [copied, setCopied] = useState(false);

  function fillSeoDescription() {
    if (!title.trim()) {
      setError("Enter a title first, then generate SEO description.");
      return;
    }
    const genre = categories.find((c) => c.id === categoryId)?.name;
    setDescription(suggestMangaDescription(title.trim(), genre));
    setError(null);
  }

  async function refreshStorageStatus() {
    setStorageStatus("Checking storage…");
    const res = await checkStorageReady();
    setStorageOk(res.ok);
    setStorageStatus(res.detail);
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
    refreshStorageStatus();
  }, []);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(STORAGE_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the SQL box and copy manually.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const externalPdf = pdfUrl.trim();
    if (!pdfFile && !externalPdf) {
      setError("Choose a PDF file OR paste a public PDF URL.");
      return;
    }
    if (externalPdf && !/^https?:\/\//i.test(externalPdf)) {
      setError("PDF URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadPct(0);

    try {
      let finalPdfUrl = externalPdf;

      if (pdfFile) {
        setProgress("Uploading PDF to Supabase Storage…");
        finalPdfUrl = await uploadFile("pdfs", pdfFile, setUploadPct);
      }

      let coverUrl: string | null = null;
      if (coverFile) {
        setProgress("Uploading cover…");
        setUploadPct(0);
        coverUrl = await uploadFile("covers", coverFile, setUploadPct);
      }

      setProgress("Saving manga metadata…");
      const genre = categories.find((c) => c.id === categoryId)?.name;
      const finalDescription =
        description.trim() || suggestMangaDescription(title.trim(), genre);
      const row = await createManga({
        title,
        description: finalDescription,
        category_id: categoryId || null,
        cover_image_url: coverUrl,
        pdf_file_url: finalPdfUrl!,
      });

      if (!hasSupabaseEnv()) {
        alert("Demo mode.");
        router.push("/browse");
      } else {
        router.push(`/manga/${row.id}`);
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      await refreshStorageStatus();
    } finally {
      setLoading(false);
      setProgress("");
      setUploadPct(0);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/manga"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-white">Upload manga</h1>
      <p className="mt-1 text-sm text-zinc-500">
        PDFs go straight to Supabase (up to 100MB). Stay logged in.
      </p>

      {/* Storage health */}
      <div
        className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
          storageOk
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            : "border-rose-500/30 bg-rose-500/10 text-rose-100"
        }`}
      >
        <div className="flex items-start gap-2">
          {storageOk ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {storageOk ? "Storage ready" : "Storage not ready"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs opacity-90">
              {storageStatus}
            </p>
            <button
              type="button"
              onClick={refreshStorageStatus}
              className="mt-2 text-xs underline opacity-80 hover:opacity-100"
            >
              Re-check storage
            </button>
          </div>
        </div>
      </div>

      {!storageOk && (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-100">
            One-time fix (required)
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-amber-100/90">
            <li>
              Open{" "}
              <a
                className="underline"
                href="https://supabase.com/dashboard/project/rksrzndwporlciwytzse/sql/new"
                target="_blank"
                rel="noreferrer"
              >
                Supabase SQL Editor
              </a>
            </li>
            <li>Click “Copy SQL” below, paste, click Run</li>
            <li>Come back → Re-check storage → Upload PDF</li>
          </ol>
          <button
            type="button"
            onClick={copySql}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-500/30"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy SQL"}
          </button>
          <textarea
            readOnly
            value={STORAGE_SQL}
            rows={6}
            className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-zinc-400"
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Title">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            placeholder="Series title"
          />
        </Field>

        <Field label="SEO description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            placeholder="Synopsis / SEO text"
          />
          <button
            type="button"
            onClick={fillSeoDescription}
            className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-white/15"
          >
            Generate SEO description
          </button>
        </Field>

        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cover image (optional)">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-zinc-950/50 px-4 py-6 transition hover:border-violet-500/40">
            <ImageIcon className="h-7 w-7 text-zinc-600" />
            <span className="text-sm text-zinc-400">
              {coverFile
                ? `${coverFile.name} (${(coverFile.size / 1024 / 1024).toFixed(2)} MB)`
                : "Choose cover image"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        <Field label="Manga PDF file (max 100MB)">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-6 transition hover:border-violet-500/60">
            <FileText className="h-7 w-7 text-violet-400" />
            <span className="text-sm text-zinc-300">
              {pdfFile
                ? `${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`
                : "Choose PDF file"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                setPdfFile(e.target.files?.[0] ?? null);
                if (e.target.files?.[0]) setPdfUrl("");
              }}
            />
          </label>
        </Field>

        <Field label="OR paste public PDF URL (workaround if file upload fails)">
          <input
            type="url"
            value={pdfUrl}
            onChange={(e) => {
              setPdfUrl(e.target.value);
              if (e.target.value) setPdfFile(null);
            }}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            placeholder="https://…/manga.pdf"
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Use this if Storage is broken: host the PDF anywhere public and paste
            the link.
          </p>
        </Field>

        {error && (
          <p className="whitespace-pre-wrap rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {progress && (
          <div>
            <p className="text-sm text-violet-300">{progress}</p>
            {uploadPct > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-violet-500 transition-all"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {loading ? "Working…" : "Publish manga"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}
