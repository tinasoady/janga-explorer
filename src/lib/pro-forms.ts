import { addDaysIso, todayIso } from "./format";
import { messages, type Locale } from "./i18n";
import { MAX_TICKET_TIERS, ticketSummary, type TicketTier } from "./tickets";
import { isCategory, type CategoryKey } from "./types";

// Lecture et validation des formulaires de l'espace pro (côté serveur : on ne fait jamais confiance au navigateur).

export type BusinessInput = { name: string; kind: string; whatsapp: string | null; phone: string | null };

export type OfferInput = {
  title: string;
  description: string;
  category: CategoryKey;
  priceOriginal: number | null;
  priceOffer: number;
  /** Billetterie (plusieurs tarifs) ; null pour un prix unique. */
  tickets: TicketTier[] | null;
  presaleUntil: string | null;
  conditions: string | null;
  location: string;
  mapUrl: string | null;
  validUntil: string;
};

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

const ERRORS = messages({
  fr: {
    defaultKind: "Établissement",
    name: "Le nom doit contenir entre 2 et 80 caractères.",
    kind: "Le type d'établissement est trop long.",
    phone: "Le numéro de téléphone est trop long.",
    contact: "Indiquez au moins un numéro WhatsApp ou de téléphone pour que les clients vous joignent.",
    whatsapp: "Ce numéro WhatsApp n'est pas valide (ex : 034 12 345 67).",
    title: "Le titre doit contenir entre 3 et 90 caractères.",
    category: "Choisissez une catégorie.",
    description: "La description doit contenir entre 10 et 1000 caractères.",
    location: "Indiquez le lieu de l'offre.",
    map: "La localisation doit être un lien Google Maps (bouton « Partager » → « Copier le lien ») ou des coordonnées GPS, ex : -15.7167, 46.3167.",
    conditions: "Les conditions sont trop longues (500 caractères maximum).",
    priceOffer: "Indiquez le prix de l'offre, en ariary.",
    priceOriginal: "Le prix normal n'est pas valide.",
    priceOrder: "Le prix normal doit être supérieur ou égal au prix de l'offre.",
    date: "Indiquez le dernier jour de validité.",
    past: "La date de fin ne peut pas être dans le passé.",
    tooFar: "La date de fin doit être dans l'année à venir.",
    imageType: "La photo doit être au format JPEG, PNG ou WebP.",
    imageSize: "La photo est trop lourde (5 Mo maximum).",
    imageInvalid: "Ce fichier n'est pas une image valide.",
    tiersCount: `Ajoutez entre 1 et ${MAX_TICKET_TIERS} tarifs.`,
    tierLabel: "Donnez un nom à chaque tarif (40 caractères maximum), ex : Billet normal, VIP.",
    tierPrice: (label: string) => `Indiquez au moins un prix (prévente ou sur place) pour « ${label} ».`,
    tierAmount: (label: string) => `Un prix de « ${label} » n'est pas valide.`,
    tierOrder: (label: string) => `Pour « ${label} », le prix en prévente ne peut pas dépasser le prix sur place.`,
    presaleDate: "La date de fin de prévente n'est pas valide.",
    presaleAfterEnd: "La prévente doit se terminer au plus tard le dernier jour de l'offre.",
    presaleWithout: "Indiquez un prix en prévente pour au moins un tarif, ou retirez la date de fin de prévente.",
  },
  en: {
    defaultKind: "Business",
    name: "The name must be between 2 and 80 characters.",
    kind: "The type of business is too long.",
    phone: "The phone number is too long.",
    contact: "Enter at least a WhatsApp or phone number so customers can reach you.",
    whatsapp: "This WhatsApp number isn't valid (e.g. 034 12 345 67).",
    title: "The title must be between 3 and 90 characters.",
    category: "Choose a category.",
    description: "The description must be between 10 and 1,000 characters.",
    location: "Enter where the deal takes place.",
    map: "The location must be a Google Maps link (\"Share\" → \"Copy link\") or GPS coordinates, e.g. -15.7167, 46.3167.",
    conditions: "The conditions are too long (500 characters max).",
    priceOffer: "Enter the deal price, in ariary.",
    priceOriginal: "The usual price isn't valid.",
    priceOrder: "The usual price must be higher than or equal to the deal price.",
    date: "Enter the last valid day.",
    past: "The end date can't be in the past.",
    tooFar: "The end date must be within the next year.",
    imageType: "The photo must be a JPEG, PNG or WebP file.",
    imageSize: "The photo is too large (5 MB max).",
    imageInvalid: "This file isn't a valid image.",
    tiersCount: `Add between 1 and ${MAX_TICKET_TIERS} ticket types.`,
    tierLabel: "Give each ticket type a name (40 characters max), e.g. Standard, VIP.",
    tierPrice: (label: string) => `Enter at least one price (presale or at the door) for "${label}".`,
    tierAmount: (label: string) => `A price for "${label}" isn't valid.`,
    tierOrder: (label: string) => `For "${label}", the presale price can't be higher than the door price.`,
    presaleDate: "The presale end date isn't valid.",
    presaleAfterEnd: "The presale must end on the deal's last day at the latest.",
    presaleWithout: "Enter a presale price for at least one ticket type, or remove the presale end date.",
  },
});

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

export function parseBusiness(formData: FormData, locale: Locale = "fr"): Parsed<BusinessInput> {
  const e = ERRORS[locale];
  const name = text(formData, "name");
  const kind = text(formData, "kind") || e.defaultKind;
  const whatsappRaw = text(formData, "whatsapp");
  const phone = text(formData, "phone");

  if (name.length < 2 || name.length > 80) return { ok: false, error: e.name };
  if (kind.length > 60) return { ok: false, error: e.kind };
  if (phone.length > 30) return { ok: false, error: e.phone };
  if (!whatsappRaw && !phone) return { ok: false, error: e.contact };
  const whatsapp = whatsappRaw ? normalizeWhatsapp(whatsappRaw) : null;
  if (whatsappRaw && !whatsapp) return { ok: false, error: e.whatsapp };

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

/**
 * Billetterie saisie dans le formulaire : champs répétés ticketLabel / ticketPresale / ticketDoor (une ligne par
 * tarif ; les lignes entièrement vides sont ignorées).
 */
function parseTickets(formData: FormData, e: (typeof ERRORS)["fr"]): Parsed<TicketTier[]> {
  const labels = formData.getAll("ticketLabel").map((v) => String(v).trim());
  const presales = formData.getAll("ticketPresale").map((v) => String(v).trim());
  const doors = formData.getAll("ticketDoor").map((v) => String(v).trim());

  const tiers: TicketTier[] = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (!label && !presales[i] && !doors[i]) continue;
    if (!label || label.length > 40) return { ok: false, error: e.tierLabel };
    const presale = parseAmount(presales[i] ?? "");
    const door = parseAmount(doors[i] ?? "");
    if (presale === "invalid" || door === "invalid") return { ok: false, error: e.tierAmount(label) };
    if (presale === null && door === null) return { ok: false, error: e.tierPrice(label) };
    if (presale !== null && door !== null && presale > door) return { ok: false, error: e.tierOrder(label) };
    tiers.push({ label, presale, door });
  }
  if (tiers.length < 1 || tiers.length > MAX_TICKET_TIERS) return { ok: false, error: e.tiersCount };
  return { ok: true, value: tiers };
}

/**
 * Lignes de billetterie telles que saisies (texte brut, JSON), pour remplir à nouveau le formulaire après une erreur :
 * React vide les champs après une action.
 */
export function echoTickets(formData: FormData) {
  const presales = formData.getAll("ticketPresale").map(String);
  const doors = formData.getAll("ticketDoor").map(String);
  return JSON.stringify(
    formData.getAll("ticketLabel").map((label, i) => ({ label: String(label), presale: presales[i] ?? "", door: doors[i] ?? "" })),
  );
}

function parseAmount(raw: string): number | null | "invalid" {
  if (!raw) return null;
  const n = Number(raw.replace(/[\s ]/g, ""));
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : "invalid";
}

export function parseOffer(formData: FormData, locale: Locale = "fr"): Parsed<OfferInput> {
  const e = ERRORS[locale];
  const title = text(formData, "title");
  const description = text(formData, "description");
  const category = text(formData, "category");
  const location = text(formData, "location");
  const mapUrl = normalizeMapLink(text(formData, "mapUrl"));
  const conditions = text(formData, "conditions");
  const validUntil = text(formData, "validUntil");
  const priceOffer = parseAmount(text(formData, "priceOffer"));
  const priceOriginal = parseAmount(text(formData, "priceOriginal"));
  const withTickets = text(formData, "pricing") === "tickets";
  const presaleUntil = text(formData, "presaleUntil");

  if (title.length < 3 || title.length > 90) return { ok: false, error: e.title };
  if (!isCategory(category)) return { ok: false, error: e.category };
  if (description.length < 10 || description.length > 1000) return { ok: false, error: e.description };
  if (location.length < 2 || location.length > 120) return { ok: false, error: e.location };
  if (mapUrl === "invalid") return { ok: false, error: e.map };
  if (conditions.length > 500) return { ok: false, error: e.conditions };

  const today = todayIso();
  let prices: { priceOffer: number; priceOriginal: number | null; tickets: TicketTier[] | null };
  if (withTickets) {
    const tickets = parseTickets(formData, e);
    if (!tickets.ok) return tickets;
    // Prix enregistrés : le tarif le moins cher en prévente ; l'affichage les recalcule selon le jour.
    const summary = ticketSummary(tickets.value, null, today);
    prices = { priceOffer: summary.price, priceOriginal: summary.original, tickets: tickets.value };
  } else {
    if (priceOffer === null || priceOffer === "invalid") return { ok: false, error: e.priceOffer };
    if (priceOriginal === "invalid") return { ok: false, error: e.priceOriginal };
    if (priceOriginal !== null && priceOriginal < priceOffer) return { ok: false, error: e.priceOrder };
    prices = { priceOffer, priceOriginal, tickets: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || Number.isNaN(Date.parse(validUntil))) {
    return { ok: false, error: e.date };
  }
  if (validUntil < today) return { ok: false, error: e.past };
  if (validUntil > addDaysIso(today, 365)) return { ok: false, error: e.tooFar };

  // Date de fin de prévente : seulement avec une billetterie, et au plus tard le dernier jour de l'offre.
  if (presaleUntil && prices.tickets) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(presaleUntil) || Number.isNaN(Date.parse(presaleUntil))) {
      return { ok: false, error: e.presaleDate };
    }
    if (presaleUntil > validUntil) return { ok: false, error: e.presaleAfterEnd };
    if (!prices.tickets.some((t) => t.presale !== null)) return { ok: false, error: e.presaleWithout };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      category,
      ...prices,
      presaleUntil: prices.tickets && presaleUntil ? presaleUntil : null,
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
export async function checkImage(
  file: File,
  locale: Locale = "fr",
): Promise<{ ok: true; ext: string } | { ok: false; error: string }> {
  const e = ERRORS[locale];
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: e.imageType };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: e.imageSize };

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const is = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  const real =
    (ext === "jpg" && is(0xff, 0xd8, 0xff)) ||
    (ext === "png" && is(0x89, 0x50, 0x4e, 0x47)) ||
    (ext === "webp" && is(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42);
  return real ? { ok: true, ext } : { ok: false, error: e.imageInvalid };
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
