import { loadJSON, saveJSON } from "./storage";

export interface StoredPhoto {
  id: string;
  src: string;
  caption: string;
}

const KEY = "bday-memories-v1";
export const MAX_PHOTOS = 10;

export function loadPhotos(): StoredPhoto[] {
  const raw = loadJSON<unknown>(KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (p): p is StoredPhoto =>
        !!p && typeof p === "object" && typeof (p as StoredPhoto).id === "string" && typeof (p as StoredPhoto).src === "string",
    )
    .map((p) => ({ id: p.id, src: p.src, caption: typeof p.caption === "string" ? p.caption : "" }))
    .slice(0, MAX_PHOTOS);
}

export const savePhotos = (list: StoredPhoto[]) => saveJSON(KEY, list);

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

/** Downscales & re-encodes a photo so it fits comfortably in localStorage. */
export async function compressImage(file: File, max = 1100, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
