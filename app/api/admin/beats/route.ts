import {
  assertAdmin,
  beatFormData,
  parseLicenses,
  saveMediaField,
  tierDefaults,
  unauthorized,
  uniqueSlug,
} from "@/lib/admin-routes";
import { jsonError, jsonOk } from "@/lib/http";
import { ensureStorage } from "@/lib/storage";
import { createBeat, createLicense, listBeats } from "@/lib/data/catalog";

export async function GET() {
  if (!(await assertAdmin())) return unauthorized();
  const { beats } = listBeats({ includeUnpublished: true, limit: 100 });
  return jsonOk({ beats });
}

/** Creates a beat (multipart form: fields + optional audio/preview/cover/stems files). */
export async function POST(request: Request) {
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

  if (!uploads.audio.url && !uploads.preview.url) {
    return jsonError("Upload the beat file (and ideally a short preview clip artists can listen to).", 422);
  }

  const licenses = parseLicenses(form.get("licenses"));
  const slug = await uniqueSlug(data.title);

  const beat = createBeat({
    ...data,
    slug,
    audioFile: uploads.audio.url,
    previewFile: uploads.preview.url ?? uploads.audio.url,
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
}
