import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeNext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";

// Lien de confirmation d'e-mail : échange le code reçu contre une session, puis renvoie vers la page voulue.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? { error: true };
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/connexion", origin));
}
