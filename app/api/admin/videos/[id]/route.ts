import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { deleteStoredFile } from "@/lib/storage";
import { deleteVideo, getVideoById, updateVideo } from "@/lib/data/catalog";

type Params = { params: Promise<{ id: string }> };

/** Lightweight field updates (publish / feature toggles) via JSON. */
export async function PATCH(request: Request, { params }: Params) {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const video = getVideoById(id);
  if (!video) return jsonError("Video not found", 404);

  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid payload", 422);

  const values: Record<string, string | number | null> = {};
  if (typeof body.published !== "undefined") values.published = body.published === true || body.published === "true" ? 1 : 0;
  if (typeof body.featured !== "undefined") values.featured = body.featured === true || body.featured === "true" ? 1 : 0;
  if (typeof body.title === "string" && body.title.trim()) values.title = body.title.trim();
  if (typeof body.description === "string") values.description = body.description.trim() || null;
  if (typeof body.url === "string") values.url = body.url.trim() || null;

  if (!Object.keys(values).length) return jsonError("Nothing to update", 422);

  updateVideo(id, values);
  return jsonOk({ video: getVideoById(id) });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await assertAdmin())) return unauthorized();
  const { id } = await params;

  const video = getVideoById(id);
  if (!video) return jsonError("Video not found", 404);

  await deleteStoredFile(video.fileUrl);
  await deleteStoredFile(video.thumbnail);
  deleteVideo(id);

  return jsonOk({ deleted: true });
}
