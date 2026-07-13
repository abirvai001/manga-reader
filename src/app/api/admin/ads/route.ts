import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { adCreateSchema, adUpdateSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = adCreateSchema.parse(body);

    if (!hasSupabaseEnv()) {
      if (isDemoMode()) {
        return jsonOk(
          {
            ad: {
              id: crypto.randomUUID(),
              ...input,
              is_active: input.is_active ?? true,
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
      .from("ad_banners")
      .insert({
        banner_image_url: input.banner_image_url,
        placement_zone: input.placement_zone,
        target_url: input.target_url ?? null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/ads");
    return jsonOk({ ad: data }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/ads");
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const input = adUpdateSchema.parse(body);
    const { id, ...patch } = input;

    if (!hasSupabaseEnv()) {
      if (isDemoMode()) return jsonOk({ updated: true, demo: true, patch });
      return jsonError("Database not configured", 503);
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ad_banners")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/ads");
    return jsonOk({ ad: data });
  } catch (err) {
    return handleApiError(err, "PATCH /api/admin/ads");
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
    const { error } = await supabase.from("ad_banners").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);

    revalidatePath("/");
    revalidatePath("/browse");
    revalidatePath("/admin/ads");
    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err, "DELETE /api/admin/ads");
  }
}
