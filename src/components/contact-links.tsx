import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { whatsappLink } from "@/lib/format";

// Les réseaux et l'e-mail de Janga Explorer se règlent par variables d'environnement (voir .env.example) :
// un moyen de contact n'apparaît que si sa variable est renseignée.

export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.38c.01-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18s.21-1.07.15-1.18c-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01" />
    </svg>
  );
}

function FacebookIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

type Contact = { key: string; label: string; href: string; icon: ReactNode; external: boolean };

/** Moyens de contact renseignés, dans l'ordre d'affichage. */
export function getContacts(): Contact[] {
  const whatsapp = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL;
  const instagram = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  const contacts: (Contact | null)[] = [
    whatsapp
      ? {
          key: "whatsapp",
          label: "WhatsApp",
          href: whatsappLink(whatsapp, "Bonjour Janga Explorer, "),
          icon: <WhatsAppIcon />,
          external: true,
        }
      : null,
    facebook ? { key: "facebook", label: "Facebook", href: facebook, icon: <FacebookIcon />, external: true } : null,
    instagram ? { key: "instagram", label: "Instagram", href: instagram, icon: <InstagramIcon />, external: true } : null,
    email ? { key: "email", label: email, href: `mailto:${email}`, icon: <Mail className="size-5" aria-hidden />, external: false } : null,
  ];
  return contacts.filter((c): c is Contact => c !== null);
}

/** Boutons ronds de contact : `dark` dans le pied de page, `light` sur fond clair (profil, téléphone). */
export function ContactLinks({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const contacts = getContacts();
  if (contacts.length === 0) return null;

  const button =
    tone === "dark"
      ? "bg-white/10 text-white hover:bg-sun hover:text-ink"
      : "border border-line bg-white text-ink hover:border-brand hover:text-brand";

  return (
    <ul className="flex flex-wrap gap-2">
      {contacts.map((c) => (
        <li key={c.key}>
          <a
            href={c.href}
            aria-label={c.key === "email" ? `Nous écrire à ${c.label}` : `Janga Explorer sur ${c.label}`}
            title={c.label}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={`grid size-10 place-items-center rounded-full transition ${button}`}
          >
            {c.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
