"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, ImageIcon, ArrowLeft } from "lucide-react";
import type { Category } from "@/lib/types";
import { createManga, uploadFile } from "@/lib/admin-actions";
import { isSupabaseConfigured } from "@/lib/utils";

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

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) {
      setError("PDF file is required");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      setProgress("Uploading PDF…");
      const pdfUrl = await uploadFile("pdfs", pdfFile);

      let coverUrl: string | null = null;
      if (coverFile) {
        setProgress("Uploading cover…");
        coverUrl = await uploadFile("covers", coverFile);
      }

      setProgress("Saving metadata…");
      const row = await createManga({
        title,
        description,
        category_id: categoryId || null,
        cover_image_url: coverUrl,
        pdf_file_url: pdfUrl,
      });

      if (!isSupabaseConfigured()) {
        alert(
          "Demo mode: upload simulated. Connect Supabase to persist manga. Opening reader with demo PDF if available."
        );
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
        PDF is rendered page-by-page in the custom viewer (no iframe).
      </p>

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
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            placeholder="Synopsis…"
          />
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
              {coverFile ? coverFile.name : "Choose cover image"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        <Field label="Manga PDF *">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-8 transition hover:border-violet-500/60">
            <FileText className="h-8 w-8 text-violet-400" />
            <span className="text-sm text-zinc-300">
              {pdfFile ? pdfFile.name : "Choose PDF file"}
            </span>
            <input
              type="file"
              accept="application/pdf"
              required
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </Field>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        {progress && (
          <p className="text-sm text-violet-300">{progress}</p>
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
