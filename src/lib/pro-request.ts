import { messages, type Locale } from "./i18n";

// Demande de compte professionnel : types d'activité, lecture et validation du formulaire.

export const PRO_KINDS = [
  { key: "hotel", label: { fr: "Hôtel / hébergement", en: "Hotel / accommodation" } },
  { key: "restaurant", label: { fr: "Restaurant / café", en: "Restaurant / café" } },
  { key: "activite", label: { fr: "Activité / excursion", en: "Activity / excursion" } },
  { key: "evenement", label: { fr: "Événement / sortie", en: "Event / night out" } },
] as const;

export type ProKind = (typeof PRO_KINDS)[number]["key"];

export function proKindLabel(key: string, locale: Locale = "fr") {
  return PRO_KINDS.find((k) => k.key === key)?.label[locale] ?? key;
}

const BUSINESS_KINDS = messages<Record<string, string>>({
  fr: {
    hotel: "Hôtel",
    restaurant: "Restaurant",
    activite: "Agence d'activités",
    evenement: "Organisateur d'événements",
    other: "Établissement",
  },
  en: {
    hotel: "Hotel",
    restaurant: "Restaurant",
    activite: "Activity provider",
    evenement: "Event organiser",
    other: "Business",
  },
});

/** Type d'établissement proposé par défaut dans la fiche de l'espace pro. */
export function proKindToBusinessKind(key: string, locale: Locale = "fr") {
  return BUSINESS_KINDS[locale][key] ?? BUSINESS_KINDS[locale].other;
}

const ERRORS = messages({
  fr: {
    fullName: "Indiquez votre nom complet.",
    company: "Indiquez le nom de votre entreprise ou établissement.",
    kind: "Choisissez votre type d'activité.",
    locality: "Indiquez la localité de votre activité.",
    capacity: "La capacité doit être un nombre entier supérieur à 0.",
    justification: "Ajoutez un justificatif : numéro NIF/STAT, page Facebook ou lien Google Maps de votre établissement.",
    email: "Cette adresse e-mail professionnelle n'est pas valide.",
    password: "Le mot de passe doit contenir au moins 8 caractères.",
  },
  en: {
    fullName: "Enter your full name.",
    company: "Enter the name of your company or business.",
    kind: "Choose your type of business.",
    locality: "Enter where your business is located.",
    capacity: "Capacity must be a whole number greater than 0.",
    justification: "Add proof of your business: NIF/STAT number, Facebook page or Google Maps link.",
    email: "This business email address isn't valid.",
    password: "The password must be at least 8 characters long.",
  },
});

export type ProRequestInput = {
  fullName: string;
  company: string;
  kind: ProKind;
  locality: string;
  capacity: number;
  justification: string;
  email: string;
  password: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** Noms des champs du formulaire, pour renvoyer la saisie après une erreur (le mot de passe n'en fait pas partie). */
export const PRO_REQUEST_FIELDS = ["fullName", "company", "kind", "locality", "capacity", "justification", "email"];

export function parseProRequest(
  formData: FormData,
  locale: Locale = "fr",
): { ok: true; value: ProRequestInput } | { ok: false; error: string } {
  const e = ERRORS[locale];
  const fullName = text(formData, "fullName");
  const company = text(formData, "company");
  const kind = text(formData, "kind");
  const locality = text(formData, "locality");
  const capacityRaw = text(formData, "capacity");
  const justification = text(formData, "justification");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const capacity = Number(capacityRaw);

  if (fullName.length < 2 || fullName.length > 80) return { ok: false, error: e.fullName };
  if (company.length < 2 || company.length > 80) return { ok: false, error: e.company };
  if (!PRO_KINDS.some((k) => k.key === kind)) return { ok: false, error: e.kind };
  if (locality.length < 2 || locality.length > 80) return { ok: false, error: e.locality };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) return { ok: false, error: e.capacity };
  if (justification.length < 5 || justification.length > 500) return { ok: false, error: e.justification };
  if (!EMAIL.test(email)) return { ok: false, error: e.email };
  if (password.length < 8) return { ok: false, error: e.password };

  return {
    ok: true,
    value: { fullName, company, kind: kind as ProKind, locality, capacity, justification, email, password },
  };
}
