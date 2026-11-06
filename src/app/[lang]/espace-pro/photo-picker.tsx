"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { messages } from "@/lib/i18n";
import { MAX_OFFER_PHOTOS, MAX_PICKED_PHOTO_BYTES, MAX_STORED_PHOTO_BYTES } from "@/lib/offer-image";
import { getSupabase } from "@/lib/supabase";
import { requestPhotoUploads } from "./actions";

/** Côté le plus long d'une photo après réduction : net sur un grand écran, léger à charger sur mobile. */
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const T = messages({
  fr: {
    label: "Photos",
    hint: (max: number) =>
      `Jusqu'à ${max} photos, 20 Mo chacune au plus : elles sont réduites avant l'envoi. La première sert de couverture.`,
    add: "Ajouter des photos",
    cover: "Couverture",
    left: "Avancer la photo",
    right: "Reculer la photo",
    remove: "Retirer la photo",
    uploading: "Envoi…",
    tooBig: (name: string) => `« ${name} » dépasse 20 Mo.`,
    format: (name: string) => `« ${name} » n'est pas une image JPEG, PNG ou WebP.`,
    failed: "L'envoi d'une photo a échoué. Réessayez.",
    full: (max: number) => `${max} photos au maximum.`,
  },
  en: {
    label: "Photos",
    hint: (max: number) =>
      `Up to ${max} photos, 20 MB each at most: they are resized before upload. The first one is the cover.`,
    add: "Add photos",
    cover: "Cover",
    left: "Move photo earlier",
    right: "Move photo later",
    remove: "Remove photo",
    uploading: "Uploading…",
    tooBig: (name: string) => `"${name}" is larger than 20 MB.`,
    format: (name: string) => `"${name}" isn't a JPEG, PNG or WebP image.`,
    failed: "A photo upload failed. Please try again.",
    full: (max: number) => `${max} photos at most.`,
  },
});

type Item = { key: string; url: string | null; preview: string; uploading: boolean };

/** Réduit la photo (orientation de l'appareil respectée) et la convertit en JPEG ; garde l'original si c'est impossible. */
async function shrink(file: File): Promise<{ blob: Blob; type: string }> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff"; // fond blanc pour les PNG transparents
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (blob) return { blob, type: "image/jpeg" };
  } catch {
    // navigateur qui ne sait pas décoder ce format : on tente l'original
  }
  return { blob: file, type: file.type };
}

/**
 * Photos d'une offre. Chaque photo choisie est réduite dans le navigateur puis envoyée directement au stockage ;
 * le formulaire ne transmet que les adresses (champs `photo`, dans l'ordre : la première est la couverture).
 */
export function PhotoPicker({ initial, onBusyChange }: { initial: string[]; onBusyChange: (busy: boolean) => void }) {
  const t = T[useLocale()];
  const inputId = useId();
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((url) => ({ key: url, url, preview: url, uploading: false })),
  );
  const [error, setError] = useState<string | null>(null);

  // Le formulaire bloque son bouton d'envoi tant qu'une photo est en cours d'envoi.
  const busy = items.some((i) => i.uploading);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  async function add(files: FileList) {
    setError(null);
    const room = MAX_OFFER_PHOTOS - items.length;
    const picked = [...files].slice(0, Math.max(room, 0));
    if (files.length > room) setError(t.full(MAX_OFFER_PHOTOS));
    const valid = picked.filter((file) => {
      if (!ACCEPTED.includes(file.type) && !file.type.startsWith("image/")) {
        setError(t.format(file.name));
        return false;
      }
      if (file.size > MAX_PICKED_PHOTO_BYTES) {
        setError(t.tooBig(file.name));
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    const pending: Item[] = valid.map((file) => ({
      key: crypto.randomUUID(),
      url: null,
      preview: URL.createObjectURL(file),
      uploading: true,
    }));
    setItems((prev) => [...prev, ...pending]);

    const uploads = await requestPhotoUploads(valid.length).catch(() => null);
    const storage = getSupabase()?.storage.from("offer-images");

    await Promise.all(
      valid.map(async (file, i) => {
        const item = pending[i];
        const target = uploads?.[i];
        let ok = false;
        if (target && storage) {
          const { blob, type } = await shrink(file);
          if (ACCEPTED.includes(type) && blob.size <= MAX_STORED_PHOTO_BYTES) {
            const { error: uploadError } = await storage.uploadToSignedUrl(target.path, target.token, blob, {
              contentType: type,
            });
            ok = !uploadError;
          } else if (!ACCEPTED.includes(type)) {
            setError(t.format(file.name));
          }
        }
        if (!ok) {
          setError((current) => current ?? t.failed);
          URL.revokeObjectURL(item.preview);
          setItems((prev) => prev.filter((p) => p.key !== item.key));
          return;
        }
        setItems((prev) => prev.map((p) => (p.key === item.key ? { ...p, url: target!.url, uploading: false } : p)));
      }),
    );
  }

  const move = (index: number, delta: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const remove = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t.label}</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item, i) => (
          <li key={item.key} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface">
            {/* Aperçu local (blob:) ou photo enregistrée : pas d'optimisation nécessaire pour une miniature. */}
            {item.preview.startsWith("blob:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.preview} alt="" className="size-full object-cover" />
            ) : (
              <Image src={item.preview} alt="" fill sizes="160px" className="object-cover" />
            )}
            {item.url && <input type="hidden" name="photo" value={item.url} />}
            {i === 0 && (
              <span className="absolute top-1 left-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {t.cover}
              </span>
            )}
            {item.uploading ? (
              <span className="absolute inset-0 grid place-items-center bg-white/60 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t.uploading}
                </span>
              </span>
            ) : (
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <span className="flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      aria-label={t.left}
                      className="grid size-7 place-items-center rounded-full bg-white/90 shadow"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                  )}
                  {i < items.length - 1 && (
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      aria-label={t.right}
                      className="grid size-7 place-items-center rounded-full bg-white/90 shadow"
                    >
                      <ChevronRight className="size-4" aria-hidden />
                    </button>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={t.remove}
                  className="grid size-7 place-items-center rounded-full bg-white/90 text-red-700 shadow"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </li>
        ))}
        {items.length < MAX_OFFER_PHOTOS && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-center text-xs font-semibold text-brand hover:border-brand"
            >
              <ImagePlus className="size-6" aria-hidden />
              {t.add}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) void add(e.target.files);
                e.target.value = "";
              }}
            />
          </li>
        )}
      </ul>
      <p className="text-xs text-muted">{t.hint(MAX_OFFER_PHOTOS)}</p>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
