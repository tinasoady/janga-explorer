import type { NextRequest } from "next/server";
import { getOffersBySlugs } from "@/lib/offers";

// GET /api/offres?slugs=a,b,c → offres encore valables, dans l'ordre demandé.
export async function GET(request: NextRequest) {
  const slugs = (request.nextUrl.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100);

  const offers = slugs.length ? await getOffersBySlugs(slugs) : [];
  return Response.json({ offers });
}
