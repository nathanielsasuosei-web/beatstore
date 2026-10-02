import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type MediaKind = "beats" | "previews" | "covers" | "videos" | "stems";

export const MEDIA_KINDS: MediaKind[] = ["beats", "previews", "covers", "videos", "stems"];

/** Folders whose contents may be served publicly. Everything else needs a token. */
const PUBLIC_KINDS: MediaKind[] = ["previews", "covers", "videos"];

const LIMITS: Record<MediaKind, number> = {
  beats: 400 * 1024 * 1024,
  previews: 60 * 1024 * 1024,
  covers: 12 * 1024 * 1024,
  videos: 600 * 1024 * 1024,
  stems: 800 * 1024 * 1024,
};

function root() {
  const dir = process.env.STORAGE_DIR || "storage";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

export function kindDir(kind: MediaKind) {
  return path.join(root(), kind);
}

export async function ensureStorage(kind?: MediaKind) {
  if (kind) {
    await fs.mkdir(kindDir(kind), { recursive: true });
    return;
  }
  for (const k of MEDIA_KINDS) await fs.mkdir(kindDir(k), { recursive: true });
}

export function isPublicKind(kind: string): kind is MediaKind {
  return PUBLIC_KINDS.includes(kind as MediaKind);
}

export function kindFromUrl(url: string | null | undefined): MediaKind | null {
  if (!url) return null;
  const m = url.match(/\/api\/media\/([a-z]+)\//);
  if (m && MEDIA_KINDS.includes(m[1] as MediaKind)) return m[1] as MediaKind;
  const local = url.match(/^storage\/([a-z]+)\//);
  if (local && MEDIA_KINDS.includes(local[1] as MediaKind)) return local[1] as MediaKind;
  return null;
}

export function fileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  return last && /^[a-zA-Z0-9._-]+$/.test(last) ? last : null;
}

/** Resolves a stored url back to a path on disk, guarding against traversal. */
export function resolveStoredFile(url: string | null | undefined): string | null {
  if (!url) return null;
  const kind = kindFromUrl(url);
  const name = fileNameFromUrl(url);
  if (!kind || !name) return null;
  const full = path.join(root(), kind, name);
  const base = path.join(root(), kind);
  if (!full.startsWith(base)) return null;
  return full;
}

const EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/aiff": "aiff",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/octet-stream": "",
};

const ALLOWED_EXT: Record<MediaKind, string[]> = {
  beats: ["mp3", "wav", "flac", "aiff", "aif", "m4a", "ogg"],
  previews: ["mp3", "wav", "m4a", "ogg"],
  covers: ["jpg", "jpeg", "png", "webp", "gif"],
  videos: ["mp4", "mov", "webm", "m4v"],
  stems: ["zip", "rar", "7z"],
};

export type SaveResult =
  | { ok: true; url: string; size: number; name: string }
  | { ok: false; error: string };

export async function saveUpload(file: File, kind: MediaKind): Promise<SaveResult> {
  if (!file || typeof file === "string") return { ok: false, error: "No file provided." };
  const size = file.size ?? 0;
  if (size === 0) return { ok: false, error: "The file is empty." };
  if (size > LIMITS[kind]) {
    return {
      ok: false,
      error: `File is too large (max ${Math.round(LIMITS[kind] / (1024 * 1024))} MB for ${kind}).`,
    };
  }

  const originalExt = (file.name.split(".").pop() || "").toLowerCase();
  const mimeExt = EXT_BY_MIME[file.type] || "";
  let ext = originalExt || mimeExt;
  if (!ALLOWED_EXT[kind].includes(ext)) {
    if (mimeExt && ALLOWED_EXT[kind].includes(mimeExt)) ext = mimeExt;
    else return { ok: false, error: `Unsupported file type ".${ext}" for ${kind}.` };
  }

  await ensureStorage(kind);
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(kindDir(kind), name), buffer);

  return {
    ok: true,
    url: `/api/media/${kind}/${name}`,
    size,
    name: file.name,
  };
}

export async function deleteStoredFile(url: string | null | undefined) {
  const full = resolveStoredFile(url);
  if (!full) return;
  try {
    await fs.unlink(full);
  } catch {
    /* already gone */
  }
}

export function contentTypeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    flac: "audio/flac",
    aiff: "audio/aiff",
    aif: "audio/aiff",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    pdf: "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}
