import { NextResponse } from "next/server";
import { getAllAds } from "@/lib/data";

export async function GET() {
  const ads = await getAllAds();
  return NextResponse.json({ ads });
}
