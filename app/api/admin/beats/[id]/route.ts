import {
  assertAdmin,
  beatFormData,
  parseLicenses,
  saveMediaField,
  unauthorized,
  uniqueSlug,
} from "@/lib/admin-routes";
import { apiHandler, jsonError, jsonOk } from "@/lib/http";
import { deleteStoredFile, isPublicKind, kindFromUrl } from "@/lib/storage";
import {
  createLicense,
  deactivateLicensesExcept,
  deleteBeat,
  getBeatById,
  updateBeat,
  updateLicense,
} from "@/lib/data/catalog";
import { ordersUsingBeat } from "@/lib/data/sales";

type Params = { params: Promise<{ id: string }> };

export const PATCH = apiHandler(async (request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const beat = getBeatById(id);
  if (!beat) return jsonError("Beat not found", 404);

  const form = await request.formData();
  const data = beatFormData(form);
  const removeCover = form.get("removeCover") === "true";

  const uploads = {
    audio: await saveMediaField(form, "audio", "beats"),
    preview: await saveMediaField(form, "preview", "previews"),
    cover: await saveMediaField(form, "cover", "covers"),
    stems: await saveMediaField(form, "stems", "stems"),
  };
  const errors = Object.values(uploads)
    .map((u) => u.error)
    .filter(Boolean) as string[];
  if (errors.length) return jsonError(errors.join(" · "), 422);

  // Resolve every field first, then clean up. A beat may legitimately point
  // several fields at one file, so we only ever delete a file the beat has
  // stopped referencing — never one a remaining field still needs (deleting a
  // file that is still `audioFile` would strip paid orders of their download).
  const next = {
    audioFile: uploads.audio.url ?? beat.audioFile,
    previewFile: uploads.preview.url ?? beat.previewFile,
    coverImage: uploads.cover.url ?? (removeCover ? null : beat.coverImage),
    stemsFile: uploads.stems.url ?? beat.stemsFile,
  };

  // Playable in the store unless it points into a protected folder (beat
  // masters, stems). Public preview folders, /demo assets and external URLs
  // are all fine.
  const previewKind = next.previewFile ? kindFromUrl(next.previewFile) : null;
  const previewIsPublic = !!next.previewFile && (!previewKind || isPublicKind(previewKind));
  if (data.published && !previewIsPublic) {
    return jsonError(
      "This beat has no public preview clip, so visitors have nothing to listen to. Upload a preview clip, or unpublish the beat until you can.",
      422
    );
  }

  const keptFiles = new Set(Object.values(next).filter(Boolean) as string[]);
  for (const previous of [beat.audioFile, beat.previewFile, beat.coverImage, beat.stemsFile]) {
    if (previous && !keptFiles.has(previous)) await deleteStoredFile(previous);
  }

  const slug = data.title !== beat.title ? await uniqueSlug(data.title, beat.id) : beat.slug;

  updateBeat(id, {
    title: data.title,
    slug,
    description: data.description,
    genre: data.genre,
    mood: data.mood,
    bpm: data.bpm,
    musicalKey: data.musicalKey,
    tags: data.tags,
    featured: data.featured ? 1 : 0,
    published: data.published ? 1 : 0,
    ...next,
  });

  const licenses = parseLicenses(form.get("licenses"));
  if (licenses.length) {
    for (const license of licenses) {
      const existing = beat.licenses.find((l) => l.tier === license.tier);
      if (existing) {
        updateLicense(existing.id, {
          name: license.name,
          price: license.price,
          description: license.description ?? null,
          fileFormat: license.fileFormat ?? null,
          popular: license.popular ? 1 : 0,
          active: license.active === false ? 0 : 1,
          sortOrder: license.sortOrder ?? 0,
        });
      } else {
        createLicense({
          beatId: id,
          tier: license.tier,
          name: license.name,
          price: license.price,
          description: license.description,
          fileFormat: license.fileFormat,
          popular: license.popular,
          active: license.active,
          sortOrder: license.sortOrder,
        });
      }
    }
    // Tiers removed from the form are deactivated (never deleted — past orders reference them).
    deactivateLicensesExcept(
      id,
      licenses.map((l) => l.tier)
    );
  }

  return jsonOk({ beat: getBeatById(id) });
});

export const DELETE = apiHandler(async (_request: Request, { params }: Params) => {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const beat = getBeatById(id);
  if (!beat) return jsonError("Beat not found", 404);

  if (ordersUsingBeat(id) > 0) {
    // Keep the file history for buyers, just take it off the store.
    updateBeat(id, { published: 0 });
    return jsonOk({ archived: true, message: "This beat has sales, so it was unpublished instead of deleted." });
  }

  await deleteStoredFile(beat.audioFile);
  await deleteStoredFile(beat.previewFile);
  await deleteStoredFile(beat.coverImage);
  await deleteStoredFile(beat.stemsFile);
  deleteBeat(id);

  return jsonOk({ deleted: true });
});
