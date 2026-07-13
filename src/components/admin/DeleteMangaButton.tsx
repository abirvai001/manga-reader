"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteManga } from "@/lib/admin-actions";
import { isSupabaseConfigured } from "@/lib/utils";

export function DeleteMangaButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteManga(id);
      if (!isSupabaseConfigured()) {
        alert("Demo mode: delete is simulated only with live Supabase.");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
    >
      <Trash2 className="h-3 w-3" />
      Delete
    </button>
  );
}
