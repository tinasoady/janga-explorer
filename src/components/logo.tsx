import Link from "next/link";

/**
 * Icône Janga Explorer : une épingle de carte dont la pointe prolonge le tronc du baobab, devant le soleil
 * couchant sur la mer. `dark` passe l'épingle et le baobab en blanc pour les fonds bleu nuit.
 */
export function LogoMark({ className = "size-9", variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  const pin = variant === "dark" ? "#fff" : "#0e2a47";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M17 40A33 33 0 0 1 83 40C83 60 63 75 50 96 37 75 17 60 17 40Z" fill={pin} />
      <circle cx="50" cy="40" r="25.5" fill="#ffb020" />
      <circle cx="65" cy="43.5" r="9" fill="#ff6a3d" />
      <path d="M24.6 46Q37 40.5 50 46T75.4 46A25.5 25.5 0 0 1 24.6 46Z" fill="#0b8fd6" />
      <path d="M28 54Q33.5 51 39 54M61 54Q66.5 51 72 54" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M47.2 31C45.6 38 42.4 46 42.2 56 42.1 60.5 42.4 64 42.5 67H57.5C57.6 64 57.9 60.5 57.8 56 57.6 46 54.4 38 52.8 31Z" fill={pin} />
      <path d="M50 33 38.5 26M50 33 44.5 22M50 33 55.5 22M50 33 61.5 26" stroke={pin} strokeWidth="3" strokeLinecap="round" />
      <g fill={pin}>
        <ellipse cx="37.5" cy="25.2" rx="5" ry="2.3" />
        <ellipse cx="44" cy="21.4" rx="4.4" ry="2.2" />
        <ellipse cx="56" cy="21.4" rx="4.4" ry="2.2" />
        <ellipse cx="62.5" cy="25.2" rx="5" ry="2.3" />
      </g>
    </svg>
  );
}

const SIZES = {
  md: { mark: "size-9", text: "text-xl" },
  lg: { mark: "size-12", text: "text-2xl lg:text-[28px]" },
};

export function Logo({ size = "md" }: { size?: keyof typeof SIZES }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Janga Explorer, accueil">
      <LogoMark className={SIZES[size].mark} />
      <span className={`${SIZES[size].text} font-extrabold tracking-tight whitespace-nowrap text-ink`}>
        Janga <span className="text-brand-dark">Explorer</span>
      </span>
    </Link>
  );
}
