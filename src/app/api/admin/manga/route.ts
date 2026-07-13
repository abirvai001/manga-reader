import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { mangaCreateSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    await requireAdmin();
    const { getMangaList } = await import("@/lib/data");
    const manga = await getMangaList({ includeUnpublished: true });
    return jsonOk({ manga });
  } catch (err) {
    return handleApiError(err, "GET /api/admin/manga");
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = mangaCreateSchema.parse(body);

    if (!hasSupabaseEnv() || isDemoMode()) {
      if (isDemoMode() && !hasSupabaseEnv()) {
        const row = {
          id: crypto.randomUUID(),
          ...input,
          created_at: new Date().toISOString(),
        };
        return jsonOk({ manga: row, demo: true });
      }
      return jsonError("Database not configured", 503);
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("manga")
      .insert({
        title: input.title,
        description: input.description || null,
        category_id: input.category_id || null,
        cover_image_url: input.cover_image_url || null,
        pdf_file_url: input.pdf_file_url,
        is_published: input.is_published ?? true,
      })
      .select()
      .single();

    if (error) {
      logger.error("create manga failed", { error: error.message });
      return jsonError(error.message, 400);
    }

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin");
    revalidatePath("/admin/manga");
    return jsonOk({ manga: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/manga");
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Missing id", 400);

    if (!hasSupabaseEnv() || (isDemoMode() && !hasSupabaseEnv())) {
      return jsonOk({ deleted: true, demo: true });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("manga").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/manga");
    revalidatePath(`/manga/${id}`);
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err, "DELETE /api/admin/manga");
  }
}
