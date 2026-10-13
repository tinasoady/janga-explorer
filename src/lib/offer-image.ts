import type { SupabaseClient } from "@supabase/supabase-js";
import { checkImage } from "./pro-forms";

const BUCKET = "offer-images";

export type UploadedImage = { ok: true; url: string; path: string } | { ok: false; error: string };

/**
 * Envoie la photo d'une offre dans le dossier de la personne connectée (`<user_id>/…`, imposé par les règles du
 * bucket) et renvoie son adresse publique. À appeler après avoir vérifié que `file` est bien un fichier non vide.
 */
export async function uploadOfferImage(supabase: SupabaseClient, userId: string, file: File): Promise<UploadedImage> {
  const image = await checkImage(file);
  if (!image.ok) return image;

  const path = `${userId}/${crypto.randomUUID()}.${image.ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) return { ok: false, error: "L'envoi de la photo a échoué. Réessayez dans un instant." };

  return { ok: true, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, path };
}

/** Supprime une photo envoyée par erreur (ex : l'enregistrement de l'offre a échoué ensuite). */
export async function removeOfferImage(supabase: SupabaseClient, path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}
