"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  ImageIcon,
  ArrowLeft,
  Wrench,
  ExternalLink,
} from "lucide-react";
import type { Category } from "@/lib/types";
import {
  createManga,
  setupStorageBuckets,
  uploadFile,
} from "@/lib/admin-actions";
import { suggestMangaDescription } from "@/lib/seo";
import { hasSupabaseEnv } from "@/lib/env";

export default function NewMangaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [uploadPct, setUploadPct] = useState(0);
  const [setupMsg, setSetupMsg] = useState<string | null>(null);

  function fillSeoDescription() {
    if (!title.trim()) {
      setError("Enter a title first, then generate SEO description.");
      return;
    }
    const genre = categories.find((c) => c.id === categoryId)?.name;
    setDescription(suggestMangaDescription(title.trim(), genre));
    setError(null);
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  async function fixStorage() {
    setSetupMsg(null);
    setError(null);
    try {
      const res = await setupStorageBuckets();
      setSetupMsg(res.message || "Storage setup finished.");
      if (res.errors?.length) {
        setError(res.errors.join(" · "));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Storage setup failed";
      setError(msg);
      setSetupMsg(
        "Run SQL: Supabase → SQL Editor → paste file supabase/storage-buckets.sql → Run"
      );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) {
      setError("PDF file is required");
      return;
    }
    setLoading(true);
    setError(null);
    setUploadPct(0);

    try {
      setProgress("Uploading PDF to storage…");
      const pdfUrl = await uploadFile("pdfs", pdfFile, setUploadPct);

      let coverUrl: string | null = null;
      if (coverFile) {
        setProgress("Uploading cover…");
        setUploadPct(0);
        coverUrl = await uploadFile("covers", coverFile, setUploadPct);
      }

      setProgress("Saving manga…");
      const genre = categories.find((c) => c.id === categoryId)?.name;
      const finalDescription =
        description.trim() || suggestMangaDescription(title.trim(), genre);
      const row = await createManga({
        title,
        description: finalDescription,
        category_id: categoryId || null,
        cover_image_url: coverUrl,
        pdf_file_url: pdfUrl,
      });

      if (!hasSupabaseEnv()) {
        alert("Demo mode: upload simulated.");
        router.push("/browse");
      } else {
        router.push(`/manga/${row.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
        PDFs upload directly to Supabase Storage (large files supported).
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <p className="font-medium">If upload fails (bucket missing)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-amber-100/90">
          <li>
            Open{" "}
            <a
              href="https://supabase.com/dashboard/project/rksrzndwporlciwytzse/sql/new"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 underline"
            >
              Supabase SQL Editor
              <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            Paste &amp; run{" "}
            <code className="rounded bg-black/30 px-1">storage-buckets.sql</code>{" "}
            from the repo
          </li>
          <li>Come back and upload again</li>
        </ol>
        <button
          type="button"
          onClick={fixStorage}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/30"
        >
          <Wrench className="h-3.5 w-3.5" />
          Try fix storage buckets
        </button>
        {setupMsg && (
          <p className="mt-2 text-xs text-amber-50/80">{setupMsg}</p>
        )}
      </div>

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
        <Field label="SEO description (Google snippet)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            placeholder="Write 1–2 sentences with the title + “read online free” + genre. Or click Generate SEO text."
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fillSeoDescription}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-white/15"
            >
              Generate SEO description
            </button>
            <span className="text-[11px] text-zinc-600">
              Auto-filled on publish if left empty.
            </span>
          </div>
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

        <Field label="Cover image (PNG/JPG)">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-zinc-950/50 px-4 py-8 transition hover:border-violet-500/40">
            <ImageIcon className="h-8 w-8 text-zinc-600" />
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

        <Field label="Manga PDF * (max 100MB)">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-8 transition hover:border-violet-500/60">
            <FileText className="h-8 w-8 text-violet-400" />
            <span className="text-sm text-zinc-300">
              {pdfFile
                ? `${pdfFile.name} (${(pdfFile.size / 1024 / 1024).toFixed(2)} MB)`
                : "Choose PDF file"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              required
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 whitespace-pre-wrap">
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
          {loading ? "Uploading…" : "Publish manga"}
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
