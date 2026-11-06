"use client";

import { useSyncExternalStore } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { messages } from "@/lib/i18n";
import { useLocale } from "./locale-provider";

const T = messages({
  fr: {
    title: "Installer l'appli",
    text: "Ajoutez Janga Explorer à votre écran d'accueil pour retrouver les bons plans en un geste, comme une application.",
    button: "Installer Janga Explorer",
    share1: "Touchez le bouton ",
    share2: "Partager",
    share3: " du navigateur.",
    add1: "Choisissez ",
    add2: "Sur l'écran d'accueil",
    add3: ", puis Ajouter.",
  },
  en: {
    title: "Install the app",
    text: "Add Janga Explorer to your home screen to find the deals in one tap, just like an app.",
    button: "Install Janga Explorer",
    share1: "Tap the browser's ",
    share2: "Share",
    share3: " button.",
    add1: "Choose ",
    add2: "Add to Home Screen",
    add3: ", then Add.",
  },
});

// Événement propre à Chrome, Edge et Samsung Internet : il permet d'ouvrir la fenêtre d'installation au clic.
type InstallPromptEvent = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = "hidden" | "prompt" | "ios";

const listeners = new Set<() => void>();
let deferred: InstallPromptEvent | null = null;
let installed = false;

const notify = () => listeners.forEach((l) => l());

// Le navigateur envoie l'événement une seule fois, souvent avant l'ouverture de la page Profil :
// on l'écoute dès le chargement du site (InstallPromptCatcher est rendu dans le layout).
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// iPhone et iPad (un iPad récent se présente comme un Mac tactile) : pas d'installation au clic, seulement par le menu Partager
function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function read(): InstallState {
  if (installed || isStandalone()) return "hidden";
  if (deferred) return "prompt";
  return isIos() ? "ios" : "hidden";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function promptInstall() {
  const event = deferred;
  if (!event) return;
  // L'événement ne sert qu'une fois ; en cas de refus, le navigateur en renverra un plus tard
  deferred = null;
  try {
    await event.prompt();
    if ((await event.userChoice).outcome === "accepted") installed = true;
  } catch {
    // fenêtre refusée par le navigateur : il reste son menu « Installer l'application »
  }
  notify();
}

/** Rendu une fois dans le layout : charge l'écoute de l'événement d'installation sur toutes les pages. */
export function InstallPromptCatcher() {
  return null;
}

/** Carte « Installer l'appli » : bouton sur Android et ordinateur, marche à suivre sur iPhone. Invisible si déjà installée. */
export function InstallAppCard() {
  const state = useSyncExternalStore(subscribe, read, () => "hidden" as const);
  const t = T[useLocale()];

  if (state === "hidden") return null;

  return (
    <section className="space-y-3 rounded-2xl bg-brand-soft p-4">
      <p className="flex items-center gap-2 font-bold">
        <Download className="size-5 text-brand" aria-hidden />
        {t.title}
      </p>
      {state === "prompt" ? (
        <>
          <p className="text-sm text-muted">{t.text}</p>
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white"
          >
            {t.button}
          </button>
        </>
      ) : (
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <Share className="size-4 shrink-0 text-sea" aria-hidden />
            <span>
              {t.share1}
              <strong className="text-fg">{t.share2}</strong>
              {t.share3}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <SquarePlus className="size-4 shrink-0 text-sea" aria-hidden />
            <span>
              {t.add1}
              <strong className="text-fg">{t.add2}</strong>
              {t.add3}
            </span>
          </li>
        </ol>
      )}
    </section>
  );
}
