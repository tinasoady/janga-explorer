"use client";

import { useSyncExternalStore } from "react";
import { Timer } from "lucide-react";
import { useLocale } from "./locale-provider";

const DAY = 86_400_000;
// Mahajanga est à UTC+3 toute l'année (pas d'heure d'été).
const OFFSET = 3 * 3_600_000;

const subscribe = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};
const nowInSeconds = () => Math.floor(Date.now() / 1000);

const pad = (n: number) => String(n).padStart(2, "0");

/** Temps restant avant minuit à Mahajanga, quand le bon plan du jour change. Rendu seulement dans le navigateur. */
export function MidnightCountdown({ className = "" }: { className?: string }) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, () => null);
  const locale = useLocale();
  if (now === null) return null;

  const local = now * 1000 + OFFSET;
  const left = Math.floor((Math.ceil(local / DAY) * DAY - local) / 1000);
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <p className={`flex items-center gap-1.5 text-xs font-semibold text-muted ${className}`}>
      <Timer className="size-4 text-brand" aria-hidden />
      <span>
        {locale === "en" ? "Changes in" : "Change dans"}{" "}
        <span className="font-extrabold text-fg tabular-nums">
          {pad(h)}:{pad(m)}:{pad(s)}
        </span>
      </span>
    </p>
  );
}
