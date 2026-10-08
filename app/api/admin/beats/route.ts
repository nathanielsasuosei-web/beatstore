import {
  assertAdmin,
  beatFormData,
  parseLicenses,
  saveMediaField,
  tierDefaults,
  unauthorized,
  uniqueSlug,
} from "@/lib/admin-routes";
import { apiHandler, jsonError, jsonOk } from "@/lib/http";
import { ensureStorage } from "@/lib/storage";
import { createBeat, createLicense, listBeats } from "@/lib/data/catalog";

export const GET = apiHandler(async () => {
  if (!(await assertAdmin())) return unauthorized();
  const { beats } = listBeats({ includeUnpublished: true, limit: 100 });
  return jsonOk({ beats });
});

/** Creates a beat (multipart form: fields + optional audio/preview/cover/stems files). */
export const POST = apiHandler(async (request: Request) => {
  if (!(await assertAdmin())) return unauthorized();

  await ensureStorage();
  const form = await request.formData();
  const data = beatFormData(form);

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

  if (!uploads.audio.url) {
    return jsonError("Upload the beat file you deliver to buyers.", 422);
  }

  // The preview is what visitors hear in the store, and it has to live in a
  // publicly-servable folder (`previews/`). Beat files are token-protected, so
  // a beat can never fall back to its own master file as the public preview —
  // that would either 401 every listen or expose the paid file.
  if (!uploads.preview.url) {
    return jsonError(
      "Upload a public preview clip (a short tagged excerpt). Beat files are protected, so the store needs a separate preview to play.",
      422
    );
  }

  const licenses = parseLicenses(form.get("licenses"));
  const slug = await uniqueSlug(data.title);

  const beat = createBeat({
    ...data,
    slug,
    audioFile: uploads.audio.url,
    previewFile: uploads.preview.url,
    coverImage: uploads.cover.url,
    stemsFile: uploads.stems.url,
  });

  for (const license of licenses.length ? licenses : tierDefaults()) {
    createLicense({
      beatId: beat.id,
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

  return jsonOk({ beatId: beat.id, slug: beat.slug }, 201);
});
