import { all, count, deleteById, get, id, insert, now, run, toBool, toDate, updateById } from "@/lib/db";
import type { Beat, BeatLicense, BeatWithLicenses, Video } from "@/lib/data/types";

type Row = Record<string, unknown>;

/* ── beats ─────────────────────────────────────────────────── */

export function mapBeat(row: Row): Beat {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: (row.description as string) ?? null,
    genre: (row.genre as string) ?? null,
    mood: (row.mood as string) ?? null,
    bpm: row.bpm === null || row.bpm === undefined ? null : Number(row.bpm),
    musicalKey: (row.musicalKey as string) ?? null,
    tags: (row.tags as string) ?? null,
    coverImage: (row.coverImage as string) ?? null,
    audioFile: (row.audioFile as string) ?? null,
    previewFile: (row.previewFile as string) ?? null,
    stemsFile: (row.stemsFile as string) ?? null,
    duration: row.duration === null || row.duration === undefined ? null : Number(row.duration),
    plays: Number(row.plays ?? 0),
    featured: toBool(row.featured),
    published: toBool(row.published),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function mapLicense(row: Row): BeatLicense {
  return {
    id: String(row.id),
    beatId: String(row.beatId),
    tier: String(row.tier),
    name: String(row.name),
    price: Number(row.price ?? 0),
    description: (row.description as string) ?? null,
    fileFormat: (row.fileFormat as string) ?? null,
    popular: toBool(row.popular),
    active: toBool(row.active),
    sortOrder: Number(row.sortOrder ?? 0),
  };
}

export function licensesForBeat(beatId: string, onlyActive = false): BeatLicense[] {
  const rows = all<Row>(
    `SELECT * FROM beat_licenses WHERE beatId = ? ${onlyActive ? "AND active = 1" : ""} ORDER BY sortOrder ASC`,
    [beatId]
  );
  return rows.map(mapLicense);
}

export function getBeatById(beatId: string): BeatWithLicenses | null {
  const row = get<Row>("SELECT * FROM beats WHERE id = ?", [beatId]);
  if (!row) return null;
  return { ...mapBeat(row), licenses: licensesForBeat(beatId) };
}

export function getBeatBySlug(slug: string): BeatWithLicenses | null {
  const row = get<Row>("SELECT * FROM beats WHERE slug = ?", [slug]);
  if (!row) return null;
  return { ...mapBeat(row), licenses: licensesForBeat(String(row.id), true) };
}

export function getLicenseById(licenseId: string) {
  const row = get<Row>("SELECT * FROM beat_licenses WHERE id = ?", [licenseId]);
  return row ? mapLicense(row) : null;
}

export type BeatFilter = {
  q?: string;
  genre?: string;
  mood?: string;
  sort?: "newest" | "plays" | "title";
  page?: number;
  limit?: number;
  includeUnpublished?: boolean;
  featuredOnly?: boolean;
};

export function listBeats(filter: BeatFilter = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (!filter.includeUnpublished) where.push("published = 1");
  if (filter.featuredOnly) where.push("featured = 1");
  if (filter.genre && filter.genre !== "All") {
    where.push("genre = ?");
    params.push(filter.genre);
  }
  if (filter.mood && filter.mood !== "All") {
    where.push("mood = ?");
    params.push(filter.mood);
  }
  if (filter.q) {
    where.push("(title LIKE ? OR tags LIKE ? OR genre LIKE ? OR mood LIKE ?)");
    const like = `%${filter.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? where.join(" AND ") : "1=1";
  const limit = Math.min(filter.limit ?? 24, 100);
  const page = Math.max(filter.page ?? 1, 1);
  const orderBy =
    filter.sort === "plays" ? "plays DESC, createdAt DESC" : filter.sort === "title" ? "title ASC" : "createdAt DESC";

  const rows = all<Row>(
    `SELECT * FROM beats WHERE ${whereSql} ORDER BY featured DESC, ${orderBy} LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  );

  const totalRow = get<{ n: number }>(`SELECT COUNT(*) AS n FROM beats WHERE ${whereSql}`, params);

  return {
    beats: rows.map((row) => ({ ...mapBeat(row), licenses: licensesForBeat(String(row.id), true) })),
    total: totalRow?.n ?? 0,
    page,
    pages: Math.max(1, Math.ceil((totalRow?.n ?? 0) / limit)),
  };
}

export function createBeat(values: {
  title: string;
  slug: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  bpm?: number | null;
  musicalKey?: string | null;
  tags?: string | null;
  coverImage?: string | null;
  audioFile?: string | null;
  previewFile?: string | null;
  stemsFile?: string | null;
  featured?: boolean;
  published?: boolean;
  duration?: number | null;
}): BeatWithLicenses {
  const beatId = id();
  const ts = now();
  insert("beats", {
    id: beatId,
    slug: values.slug,
    title: values.title,
    description: values.description ?? null,
    genre: values.genre ?? null,
    mood: values.mood ?? null,
    bpm: values.bpm ?? null,
    musicalKey: values.musicalKey ?? null,
    tags: values.tags ?? null,
    coverImage: values.coverImage ?? null,
    audioFile: values.audioFile ?? null,
    previewFile: values.previewFile ?? null,
    stemsFile: values.stemsFile ?? null,
    duration: values.duration ?? null,
    plays: 0,
    featured: values.featured ? 1 : 0,
    published: values.published === false ? 0 : 1,
    createdAt: ts,
    updatedAt: ts,
  });
  return getBeatById(beatId)!;
}

export function updateBeat(beatId: string, values: Record<string, string | number | null>) {
  updateById("beats", beatId, { ...values, updatedAt: now() });
  return getBeatById(beatId);
}

export function deleteBeat(beatId: string) {
  deleteById("beats", beatId);
}

export function incrementPlays(slug: string) {
  run("UPDATE beats SET plays = plays + 1 WHERE slug = ?", [slug]);
}

export function beatGenres(): string[] {
  const rows = all<{ genre: string | null }>(
    "SELECT DISTINCT genre FROM beats WHERE published = 1 AND genre IS NOT NULL ORDER BY genre ASC"
  );
  return rows.map((r) => r.genre!).filter(Boolean);
}

export function beatCounts() {
  const published = get<{ n: number }>("SELECT COUNT(*) AS n FROM beats WHERE published = 1")?.n ?? 0;
  const total = get<{ n: number }>("SELECT COUNT(*) AS n FROM beats")?.n ?? 0;
  const plays = get<{ n: number }>("SELECT COALESCE(SUM(plays),0) AS n FROM beats")?.n ?? 0;
  return { published, total, plays };
}

/* ── licences ──────────────────────────────────────────────── */

export function createLicense(values: {
  beatId: string;
  tier: string;
  name: string;
  price: number;
  description?: string | null;
  fileFormat?: string | null;
  popular?: boolean;
  active?: boolean;
  sortOrder?: number;
}) {
  const licenseId = id();
  insert("beat_licenses", {
    id: licenseId,
    beatId: values.beatId,
    tier: values.tier,
    name: values.name,
    price: values.price,
    description: values.description ?? null,
    fileFormat: values.fileFormat ?? null,
    popular: values.popular ? 1 : 0,
    active: values.active === false ? 0 : 1,
    sortOrder: values.sortOrder ?? 0,
  });
  return getLicenseById(licenseId)!;
}

export function updateLicense(licenseId: string, values: Record<string, string | number | null>) {
  updateById("beat_licenses", licenseId, values);
}

export function deactivateLicensesExcept(beatId: string, tiers: string[]) {
  if (!tiers.length) {
    run("UPDATE beat_licenses SET active = 0 WHERE beatId = ?", [beatId]);
    return;
  }
  const placeholders = tiers.map(() => "?").join(", ");
  run(`UPDATE beat_licenses SET active = 0 WHERE beatId = ? AND tier NOT IN (${placeholders})`, [beatId, ...tiers]);
}

export function licenseExists(beatId: string, tier: string) {
  return Boolean(get<{ id: string }>("SELECT id FROM beat_licenses WHERE beatId = ? AND tier = ?", [beatId, tier]));
}

/* ── videos ────────────────────────────────────────────────── */

export function mapVideo(row: Row): Video {
  return {
    id: String(row.id),
    title: String(row.title),
    description: (row.description as string) ?? null,
    source: String(row.source ?? "youtube"),
    url: (row.url as string) ?? null,
    fileUrl: (row.fileUrl as string) ?? null,
    thumbnail: (row.thumbnail as string) ?? null,
    featured: toBool(row.featured),
    published: toBool(row.published),
    createdAt: toDate(row.createdAt) ?? new Date(),
    updatedAt: toDate(row.updatedAt) ?? new Date(),
  };
}

export function listVideos(includeUnpublished = false): Video[] {
  const rows = all<Row>(
    `SELECT * FROM videos ${includeUnpublished ? "" : "WHERE published = 1"} ORDER BY featured DESC, createdAt DESC`
  );
  return rows.map(mapVideo);
}

export function getVideoById(videoId: string): Video | null {
  const row = get<Row>("SELECT * FROM videos WHERE id = ?", [videoId]);
  return row ? mapVideo(row) : null;
}

export function createVideo(values: {
  title: string;
  description?: string | null;
  source?: string;
  url?: string | null;
  fileUrl?: string | null;
  thumbnail?: string | null;
  featured?: boolean;
  published?: boolean;
}) {
  const videoId = id();
  const ts = now();
  insert("videos", {
    id: videoId,
    title: values.title,
    description: values.description ?? null,
    source: values.source ?? "youtube",
    url: values.url ?? null,
    fileUrl: values.fileUrl ?? null,
    thumbnail: values.thumbnail ?? null,
    featured: values.featured ? 1 : 0,
    published: values.published === false ? 0 : 1,
    createdAt: ts,
    updatedAt: ts,
  });
  return getVideoById(videoId)!;
}

export function updateVideo(videoId: string, values: Record<string, string | number | null>) {
  updateById("videos", videoId, { ...values, updatedAt: now() });
  return getVideoById(videoId);
}

export function deleteVideo(videoId: string) {
  deleteById("videos", videoId);
}

export function countVideos() {
  return count("videos", "published = 1");
}
