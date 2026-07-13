"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { createCategory, deleteCategory } from "@/lib/admin-actions";
import { isSupabaseConfigured, slugify } from "@/lib/utils";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const slug = slugify(name);
      const row = await createCategory(name.trim(), slug);
      if (!isSupabaseConfigured()) {
        setCategories((prev) => [...prev, row as Category]);
        setMessage("Demo mode: category added locally for this session only.");
      } else {
        await load();
        setMessage("Category created.");
      }
      setName("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      if (!isSupabaseConfigured()) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setMessage("Demo mode: removed from local list.");
      } else {
        await load();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Organize manga by genre / collection
      </p>

      <form
        onSubmit={onAdd}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sci-Fi"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      {message && (
        <p className="mt-3 text-sm text-zinc-400">{message}</p>
      )}

      <ul className="mt-8 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between bg-zinc-900/40 px-4 py-3"
          >
            <div>
              <p className="font-medium text-white">{c.name}</p>
              <p className="text-xs text-zinc-500">/{c.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
