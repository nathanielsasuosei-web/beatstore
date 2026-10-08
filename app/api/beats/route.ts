import { listBeats } from "@/lib/data/catalog";
import { apiHandler, jsonOk } from "@/lib/http";

/** Public storefront feed used by the client-side filters on the catalogue. */
export const GET = apiHandler(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const genre = params.get("genre")?.trim() ?? "";
  const mood = params.get("mood")?.trim() ?? "";
  const sortParam = params.get("sort") ?? "newest";
  const sort = sortParam === "plays" || sortParam === "title" ? sortParam : "newest";
  const limit = Number.parseInt(params.get("limit") ?? "24", 10) || 24;
  const page = Number.parseInt(params.get("page") ?? "1", 10) || 1;

  const result = listBeats({ q, genre, mood, sort, page, limit });

  return jsonOk({
    beats: result.beats.map((beat) => ({
      id: beat.id,
      slug: beat.slug,
      title: beat.title,
      genre: beat.genre,
      mood: beat.mood,
      bpm: beat.bpm,
      musicalKey: beat.musicalKey,
      coverImage: beat.coverImage,
      previewFile: beat.previewFile,
      plays: beat.plays,
      tags: beat.tags,
      licenses: beat.licenses.map((l) => ({
        id: l.id,
        tier: l.tier,
        name: l.name,
        price: l.price,
        fileFormat: l.fileFormat,
        popular: l.popular,
      })),
    })),
    total: result.total,
    page: result.page,
    pages: result.pages,
  });
});
