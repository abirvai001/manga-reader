import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { categoryCreateSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = categoryCreateSchema.parse(body);

    if (!hasSupabaseEnv()) {
      if (isDemoMode()) {
        return jsonOk(
          {
            category: {
              id: crypto.randomUUID(),
              ...input,
              created_at: new Date().toISOString(),
            },
            demo: true,
          },
          { status: 201 }
        );
      }
      return jsonError("Database not configured", 503);
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert(input)
      .select()
      .single();
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/categories");
    return jsonOk({ category: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/categories");
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return jsonError("Missing id", 400);

    if (!hasSupabaseEnv()) {
      if (isDemoMode()) return jsonOk({ deleted: true, demo: true });
      return jsonError("Database not configured", 503);
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/categories");
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err, "DELETE /api/admin/categories");
  }
}
