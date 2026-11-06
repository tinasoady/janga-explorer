"use client";

import { Children, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { messages } from "@/lib/i18n";
import { useLocale } from "./locale-provider";

const T = messages({
  fr: {
    slide: (i: number, n: number) => `${i} sur ${n}`,
    previous: "Précédent",
    next: "Suivant",
    pause: "Mettre en pause le défilement",
    play: "Reprendre le défilement",
    goTo: (i: number) => `Aller à l'élément ${i}`,
  },
  en: {
    slide: (i: number, n: number) => `${i} of ${n}`,
    previous: "Previous",
    next: "Next",
    pause: "Pause the slideshow",
    play: "Resume the slideshow",
    goTo: (i: number) => `Go to item ${i}`,
  },
});

// Préférence « réduire les animations » de l'appareil : pas de défilement automatique dans ce cas.
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (onChange: () => void) => {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const prefersReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;

/**
 * Éléments qui défilent horizontalement, un à la fois : glisser du doigt, flèches (ordinateur) et points.
 * `autoPlay` (millisecondes) fait avancer tout seul ; le défilement s'arrête au survol, au focus clavier, sur le bouton
 * pause, et quand l'appareil demande moins d'animations.
 * `overlay` : points et flèches posés sur l'élément (galerie photo) plutôt qu'en dessous.
 */
export function Slider({
  children,
  label,
  autoPlay,
  overlay = false,
  className = "",
}: {
  children: ReactNode;
  label: string;
  autoPlay?: number;
  overlay?: boolean;
  className?: string;
}) {
  const t = T[useLocale()];
  const slides = Children.toArray(children);
  const count = slides.length;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => true);
  const playing = Boolean(autoPlay) && count > 1 && !paused && !hovered && !reduced;

  const goTo = (target: number) => {
    const el = track.current;
    if (!el) return;
    const next = (target + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const el = track.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((current + 1) % count) * el.clientWidth, behavior: "smooth" });
    }, autoPlay);
    return () => clearInterval(id);
  }, [playing, autoPlay, count]);

  if (count === 0) return null;

  const arrow = "grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={`group relative ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
    >
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        aria-live={playing ? "off" : "polite"}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={t.slide(i + 1, count)}
            inert={i !== index}
            className="h-full w-full shrink-0 snap-center snap-always"
          >
            {slide}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={t.previous}
            className={`${arrow} absolute top-1/2 left-2 hidden -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:grid`}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={t.next}
            className={`${arrow} absolute top-1/2 right-2 hidden -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 md:grid`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div
            className={`flex items-center justify-center gap-1.5 ${
              overlay ? "absolute inset-x-0 bottom-3" : "pt-3"
            }`}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t.goTo(i + 1)}
                aria-current={i === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all ${i === index ? "w-6" : "w-2"} ${
                  overlay ? (i === index ? "bg-white" : "bg-white/60") : i === index ? "bg-brand" : "bg-line"
                }`}
              />
            ))}
            {autoPlay && !reduced && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? t.play : t.pause}
                className={`ml-1 grid size-6 place-items-center rounded-full ${
                  overlay ? "bg-white/80 text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
