import { isStatEvent } from "@/lib/stats";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/stats { offerId, event } : compte une vue de fiche ou un clic de contact (envoyé par navigator.sendBeacon).
// La base ignore les offres qui ne sont pas en ligne ; en mode démonstration, rien n'est enregistré.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const { offerId, event } = (body ?? {}) as { offerId?: unknown; event?: unknown };
  if (typeof offerId !== "string" || !UUID.test(offerId) || !isStatEvent(event)) {
    return new Response(null, { status: 400 });
  }

  await getSupabase()?.rpc("track_offer_event", { target: offerId, event });
  return new Response(null, { status: 204 });
}
