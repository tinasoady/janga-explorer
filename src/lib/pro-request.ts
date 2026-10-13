// Demande de compte professionnel : types d'activité, lecture et validation du formulaire.

export const PRO_KINDS = [
  { key: "hotel", label: "Hôtel / hébergement" },
  { key: "restaurant", label: "Restaurant / café" },
  { key: "activite", label: "Activité / excursion" },
  { key: "evenement", label: "Événement / sortie" },
] as const;

export type ProKind = (typeof PRO_KINDS)[number]["key"];

export function proKindLabel(key: string) {
  return PRO_KINDS.find((k) => k.key === key)?.label ?? key;
}

/** Type d'établissement proposé par défaut dans la fiche de l'espace pro. */
export function proKindToBusinessKind(key: string) {
  switch (key) {
    case "hotel":
      return "Hôtel";
    case "restaurant":
      return "Restaurant";
    case "activite":
      return "Agence d'activités";
    case "evenement":
      return "Organisateur d'événements";
    default:
      return "Établissement";
  }
}

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
): { ok: true; value: ProRequestInput } | { ok: false; error: string } {
  const fullName = text(formData, "fullName");
  const company = text(formData, "company");
  const kind = text(formData, "kind");
  const locality = text(formData, "locality");
  const capacityRaw = text(formData, "capacity");
  const justification = text(formData, "justification");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const capacity = Number(capacityRaw);

  if (fullName.length < 2 || fullName.length > 80) return { ok: false, error: "Indiquez votre nom complet." };
  if (company.length < 2 || company.length > 80) {
    return { ok: false, error: "Indiquez le nom de votre entreprise ou établissement." };
  }
  if (!PRO_KINDS.some((k) => k.key === kind)) return { ok: false, error: "Choisissez votre type d'activité." };
  if (locality.length < 2 || locality.length > 80) return { ok: false, error: "Indiquez la localité de votre activité." };
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100000) {
    return { ok: false, error: "La capacité doit être un nombre entier supérieur à 0." };
  }
  if (justification.length < 5 || justification.length > 500) {
    return {
      ok: false,
      error: "Ajoutez un justificatif : numéro NIF/STAT, page Facebook ou lien Google Maps de votre établissement.",
    };
  }
  if (!EMAIL.test(email)) return { ok: false, error: "Cette adresse e-mail professionnelle n'est pas valide." };
  if (password.length < 8) return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };

  return {
    ok: true,
    value: { fullName, company, kind: kind as ProKind, locality, capacity, justification, email, password },
  };
}
