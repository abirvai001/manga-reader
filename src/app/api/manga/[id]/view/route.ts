import { NextRequest, NextResponse } from "next/server";
import { incrementMangaViews } from "@/lib/data";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/manga/:id/view — register one view for a manga title.
 * Public; called once per browser session per manga from the client.
 */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const views = await incrementMangaViews(id);
  if (views === null) {
    // Soft-fail so the reader still works if column/RPC not migrated yet
    return NextResponse.json({ views: 0, ok: false });
  }

  return NextResponse.json({ views, ok: true });
}
