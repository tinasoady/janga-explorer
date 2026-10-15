import Link from "next/link";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {/* soleil levant sur la mer */}
      <g stroke="#ffb020" strokeWidth="2.4" strokeLinecap="round">
        <line x1="20" y1="3" x2="20" y2="7" />
        <line x1="8" y1="8" x2="10.8" y2="10.8" />
        <line x1="32" y1="8" x2="29.2" y2="10.8" />
        <line x1="3" y1="20" x2="7" y2="20" />
        <line x1="33" y1="20" x2="37" y2="20" />
      </g>
      <path d="M9 22a11 11 0 0 1 22 0Z" fill="#ff6a3d" />
      <path d="M3 26c4 0 4-2.5 8.5-2.5S16 26 20 26s4.5-2.5 8.5-2.5S33 26 37 26" fill="none" stroke="#0b8fd6" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M6 32c3.5 0 3.5-2.3 7-2.3s3.5 2.3 7 2.3 3.5-2.3 7-2.3 3.5 2.3 7 2.3" fill="none" stroke="#0e2a47" strokeWidth="2.6" strokeLinecap="round" />
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
        Janga <span className="text-sea">Explorer</span>
      </span>
    </Link>
  );
}
