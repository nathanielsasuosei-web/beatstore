import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { TIER_META, type LicenseTier } from "@/lib/constants";
import { saveUpload, type MediaKind } from "@/lib/storage";
import { getBeatBySlug } from "@/lib/data/catalog";

export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export function unauthorized() {
  return Response.json({ ok: false, error: "Admin access required." }, { status: 403 });
}

export type LicenseInput = {
  tier: string;
  name: string;
  price: number; // major units from the form
  description?: string | null;
  fileFormat?: string | null;
  popular?: boolean;
  active?: boolean;
  sortOrder?: number;
};

/** Parses the licence rows the admin form sends as a JSON string. */
export function parseLicenses(raw: FormDataEntryValue | null): LicenseInput[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw) as LicenseInput[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.tier === "string" && ["basic", "premium", "exclusive"].includes(l.tier))
      .map((l, index) => ({
        tier: l.tier,
        name: (l.name || TIER_META[l.tier as LicenseTier].label).slice(0, 80),
        price: Math.max(0, Math.round((Number(l.price) || 0) * 100)),
        description: l.description ? String(l.description).slice(0, 600) : TIER_META[l.tier as LicenseTier].blurb,
        fileFormat: l.fileFormat ? String(l.fileFormat).slice(0, 80) : TIER_META[l.tier as LicenseTier].files,
        popular: Boolean(l.popular),
        active: l.active !== false,
        sortOrder: typeof l.sortOrder === "number" ? l.sortOrder : index,
      }));
  } catch {
    return [];
  }
}

export function tierDefaults() {
  return (Object.keys(TIER_META) as LicenseTier[]).map((tier, index) => ({
    tier,
    name: TIER_META[tier].label,
    price: TIER_META[tier].defaultPrice,
    description: TIER_META[tier].blurb,
    fileFormat: TIER_META[tier].files,
    popular: tier === "premium",
    active: true,
    sortOrder: index,
  }));
}

export async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "beat";
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = getBeatBySlug(candidate);
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${n++}`;
  }
}

export async function saveMediaField(form: FormData, field: string, kind: MediaKind) {
  const value = form.get(field);
  if (!value || typeof value === "string") return { url: null as string | null, error: null as string | null };
  const file = value as File;
  if (!file.size) return { url: null, error: null };
  const result = await saveUpload(file, kind);
  if (!result.ok) return { url: null, error: `${field}: ${result.error}` };
  return { url: result.url, error: null };
}

export function beatFormData(form: FormData) {
  const text = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const num = (key: string) => {
    const v = text(key);
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };
  const featuredRaw = form.get("featured");
  const publishedRaw = form.get("published");
  return {
    title: text("title") ?? "Untitled beat",
    description: text("description"),
    genre: text("genre"),
    mood: text("mood"),
    bpm: num("bpm"),
    musicalKey: text("musicalKey"),
    tags: text("tags"),
    featured: featuredRaw === "on" || featuredRaw === "true",
    published: publishedRaw !== "false",
  };
}
