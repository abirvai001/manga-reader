import { NextRequest, NextResponse } from "next/server";
import { getAdByZone } from "@/lib/data";
import type { PlacementZone } from "@/lib/types";
import { PLACEMENT_ZONES } from "@/lib/types";

const validZones = new Set(PLACEMENT_ZONES.map((z) => z.value));

export async function GET(req: NextRequest) {
  const zone = req.nextUrl.searchParams.get("zone") as PlacementZone | null;

  if (!zone || !validZones.has(zone)) {
    return NextResponse.json({ error: "Invalid zone" }, { status: 400 });
  }

  const ad = await getAdByZone(zone);
  return NextResponse.json({ ad });
}
