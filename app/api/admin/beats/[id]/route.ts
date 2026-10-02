import {
  assertAdmin,
  beatFormData,
  parseLicenses,
  saveMediaField,
  unauthorized,
  uniqueSlug,
} from "@/lib/admin-routes";
import { jsonError, jsonOk } from "@/lib/http";
import { deleteStoredFile } from "@/lib/storage";
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

export async function PATCH(request: Request, { params }: Params) {
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

  // Remove replaced files only after the new one is safely on disk.
  if (uploads.audio.url && beat.audioFile && beat.audioFile !== uploads.audio.url) {
    await deleteStoredFile(beat.audioFile);
  }
  if (uploads.preview.url && beat.previewFile && beat.previewFile !== uploads.preview.url) {
    await deleteStoredFile(beat.previewFile);
  }
  if (removeCover && beat.coverImage) await deleteStoredFile(beat.coverImage);
  if (uploads.cover.url && beat.coverImage && beat.coverImage !== uploads.cover.url) {
    await deleteStoredFile(beat.coverImage);
  }
  if (uploads.stems.url && beat.stemsFile && beat.stemsFile !== uploads.stems.url) {
    await deleteStoredFile(beat.stemsFile);
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
    audioFile: uploads.audio.url ?? beat.audioFile,
    previewFile: uploads.preview.url ?? beat.previewFile,
    coverImage: uploads.cover.url ?? (removeCover ? null : beat.coverImage),
    stemsFile: uploads.stems.url ?? beat.stemsFile,
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
}

export async function DELETE(_request: Request, { params }: Params) {
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
}
