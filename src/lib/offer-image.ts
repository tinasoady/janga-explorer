import type { SupabaseClient } from "@supabase/supabase-js";

// Photos des offres. Le navigateur les réduit puis les envoie directement au bucket public `offer-images`, grâce à
// des liens d'envoi signés préparés ici : le serveur web (limité à 4,5 Mo par requête sur Vercel) ne voit passer que
// leurs adresses. Chaque personne écrit dans son dossier (`<user_id>/…`), imposé par les règles du bucket.

const BUCKET = "offer-images";

/** Photos par offre : la couverture et 7 en plus (même limite que la base). */
export const MAX_OFFER_PHOTOS = 8;

/** Taille maximale d'une photo choisie, avant réduction dans le navigateur. */
export const MAX_PICKED_PHOTO_BYTES = 20 * 1024 * 1024;

/** Taille maximale d'un fichier envoyé au bucket (même limite que la base). */
export const MAX_STORED_PHOTO_BYTES = 10 * 1024 * 1024;

export type PhotoUpload = { path: string; token: string; url: string };

/** Prépare `count` liens d'envoi signés dans le dossier de la personne connectée. */
export async function createPhotoUploads(
  supabase: SupabaseClient,
  userId: string,
  count: number,
  ext: "jpg" | "png" | "webp" = "jpg",
): Promise<PhotoUpload[] | null> {
  const uploads: PhotoUpload[] = [];
  for (let i = 0; i < count; i++) {
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return null;
    uploads.push({ path, token: data.token, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  }
  return uploads;
}

/** Début des adresses publiques du bucket : https://<projet>.supabase.co/storage/v1/object/public/offer-images/ */
function publicPrefix() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/${BUCKET}/` : null;
}

/** Chemin dans le bucket d'une photo hébergée chez nous, ou null pour une autre adresse (photos d'exemple…). */
export function offerPhotoPath(url: string) {
  const prefix = publicPrefix();
  if (!prefix || !url.startsWith(prefix)) return null;
  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0]);
  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(path) ? path : null;
}

/** Vrai si la photo vient d'être envoyée par cette personne (elle est dans son dossier du bucket). */
export function isOwnPhoto(url: string, userId: string) {
  return offerPhotoPath(url)?.startsWith(`${userId}/`) ?? false;
}

/** Supprime des photos du bucket (retirées d'une offre, ou envoyées pour un enregistrement qui a échoué). */
export async function removeOfferPhotos(supabase: SupabaseClient, urls: string[]) {
  const paths = urls.map(offerPhotoPath).filter((p): p is string => p !== null);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
