import { addDaysIso, todayIso } from "./format";
import { isCategory, type CategoryKey } from "./types";

// Lecture et validation des formulaires de l'espace pro (côté serveur : on ne fait jamais confiance au navigateur).

export type BusinessInput = { name: string; kind: string; whatsapp: string | null; phone: string | null };

export type OfferInput = {
  title: string;
  description: string;
  category: CategoryKey;
  priceOriginal: number | null;
  priceOffer: number;
  conditions: string | null;
  location: string;
  mapUrl: string | null;
  validUntil: string;
};

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/**
 * Numéro WhatsApp au format international sans "+", ex : 261341234567.
 * Accepte « 034 12 345 67 », « +261 34 12 345 67 » ou « 261341234567 ».
 */
export function normalizeWhatsapp(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!/^[0-9]+$/.test(digits)) return null;
  if (digits.startsWith("0") && digits.length === 10) digits = `261${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function parseBusiness(formData: FormData): Parsed<BusinessInput> {
  const name = text(formData, "name");
  const kind = text(formData, "kind") || "Établissement";
  const whatsappRaw = text(formData, "whatsapp");
  const phone = text(formData, "phone");

  if (name.length < 2 || name.length > 80) return { ok: false, error: "Le nom doit contenir entre 2 et 80 caractères." };
  if (kind.length > 60) return { ok: false, error: "Le type d'établissement est trop long." };
  if (phone.length > 30) return { ok: false, error: "Le numéro de téléphone est trop long." };
  if (!whatsappRaw && !phone) {
    return { ok: false, error: "Indiquez au moins un numéro WhatsApp ou de téléphone pour que les clients vous joignent." };
  }
  const whatsapp = whatsappRaw ? normalizeWhatsapp(whatsappRaw) : null;
  if (whatsappRaw && !whatsapp) return { ok: false, error: "Ce numéro WhatsApp n'est pas valide (ex : 034 12 345 67)." };

  return { ok: true, value: { name, kind, whatsapp, phone: phone || null } };
}

const COORDINATES = /^(-?\d{1,2}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/;

/**
 * Localisation Google Maps saisie par le professionnel : le lien « Partager » de l'application
 * (maps.app.goo.gl/…, google.com/maps/…) ou des coordonnées GPS (« -15.7167, 46.3167 »).
 * Renvoie un lien https à enregistrer, null si le champ est vide, "invalid" sinon.
 */
export function normalizeMapLink(input: string): string | null | "invalid" {
  const raw = input.trim();
  if (!raw) return null;

  const coords = raw.match(COORDINATES);
  if (coords) {
    const lat = Number(coords[1].replace(",", "."));
    const lng = Number(coords[2].replace(",", "."));
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return "invalid";
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return "invalid";
  }
  const host = url.hostname.toLowerCase();
  const isGoogleMaps =
    host === "maps.app.goo.gl" ||
    (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
    /^maps\.google\.[a-z.]+$/.test(host) ||
    (/^(www\.)?google\.[a-z.]+$/.test(host) && url.pathname.startsWith("/maps"));
  if (!isGoogleMaps || url.username || url.password) return "invalid";

  url.protocol = "https:";
  const link = url.toString();
  return link.length <= 500 ? link : "invalid";
}

function parseAmount(raw: string): number | null | "invalid" {
  if (!raw) return null;
  const n = Number(raw.replace(/[\s ]/g, ""));
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : "invalid";
}

export function parseOffer(formData: FormData): Parsed<OfferInput> {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const category = text(formData, "category");
  const location = text(formData, "location");
  const mapUrl = normalizeMapLink(text(formData, "mapUrl"));
  const conditions = text(formData, "conditions");
  const validUntil = text(formData, "validUntil");
  const priceOffer = parseAmount(text(formData, "priceOffer"));
  const priceOriginal = parseAmount(text(formData, "priceOriginal"));

  if (title.length < 3 || title.length > 90) return { ok: false, error: "Le titre doit contenir entre 3 et 90 caractères." };
  if (!isCategory(category)) return { ok: false, error: "Choisissez une catégorie." };
  if (description.length < 10 || description.length > 1000) {
    return { ok: false, error: "La description doit contenir entre 10 et 1000 caractères." };
  }
  if (location.length < 2 || location.length > 120) return { ok: false, error: "Indiquez le lieu de l'offre." };
  if (mapUrl === "invalid") {
    return {
      ok: false,
      error:
        "La localisation doit être un lien Google Maps (bouton « Partager » → « Copier le lien ») ou des coordonnées GPS, ex : -15.7167, 46.3167.",
    };
  }
  if (conditions.length > 500) return { ok: false, error: "Les conditions sont trop longues (500 caractères maximum)." };
  if (priceOffer === null || priceOffer === "invalid") return { ok: false, error: "Indiquez le prix de l'offre, en ariary." };
  if (priceOriginal === "invalid") return { ok: false, error: "Le prix normal n'est pas valide." };
  if (priceOriginal !== null && priceOriginal < priceOffer) {
    return { ok: false, error: "Le prix normal doit être supérieur ou égal au prix de l'offre." };
  }

  const today = todayIso();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || Number.isNaN(Date.parse(validUntil))) {
    return { ok: false, error: "Indiquez le dernier jour de validité." };
  }
  if (validUntil < today) return { ok: false, error: "La date de fin ne peut pas être dans le passé." };
  if (validUntil > addDaysIso(today, 365)) return { ok: false, error: "La date de fin doit être dans l'année à venir." };

  return {
    ok: true,
    value: {
      title,
      description,
      category,
      priceOriginal,
      priceOffer,
      conditions: conditions || null,
      location,
      mapUrl,
      validUntil,
    },
  };
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Vérifie le type réel de l'image d'après ses premiers octets (le type annoncé par le navigateur est falsifiable). */
export async function checkImage(file: File): Promise<{ ok: true; ext: string } | { ok: false; error: string }> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "La photo doit être au format JPEG, PNG ou WebP." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "La photo est trop lourde (5 Mo maximum)." };

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const is = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  const real =
    (ext === "jpg" && is(0xff, 0xd8, 0xff)) ||
    (ext === "png" && is(0x89, 0x50, 0x4e, 0x47)) ||
    (ext === "webp" && is(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42);
  return real ? { ok: true, ext } : { ok: false, error: "Ce fichier n'est pas une image valide." };
}

/** "Menu duo au bord de mer" → "menu-duo-au-bord-de-mer-k3x9a" */
export function makeSlug(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return `${base || "offre"}-${crypto.randomUUID().slice(0, 5)}`;
}
