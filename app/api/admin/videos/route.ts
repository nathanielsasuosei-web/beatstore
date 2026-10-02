import { assertAdmin, saveMediaField, unauthorized } from "@/lib/admin-routes";
import { jsonError, jsonOk } from "@/lib/http";
import { ensureStorage } from "@/lib/storage";
import { createVideo, listVideos } from "@/lib/data/catalog";

export async function GET() {
  if (!(await assertAdmin())) return unauthorized();
  return jsonOk({ videos: listVideos(true) });
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) return unauthorized();
  await ensureStorage();

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("Give the video a title.", 422);

  const description = String(form.get("description") ?? "").trim() || null;
  const url = String(form.get("url") ?? "").trim() || null;
  const featured = form.get("featured") === "on" || form.get("featured") === "true";
  const published = form.get("published") !== "false";
  const source = form.get("source") === "file" ? "file" : "youtube";

  const file = await saveMediaField(form, "video", "videos");
  if (file.error) return jsonError(file.error, 422);

  if (source === "file" && !file.url) return jsonError("Upload a video file or switch to a YouTube link.", 422);
  if (source === "youtube" && !url) return jsonError("Paste the YouTube link.", 422);

  const thumbnail = await saveMediaField(form, "thumbnail", "covers");
  if (thumbnail.error) return jsonError(thumbnail.error, 422);

  const video = createVideo({
    title,
    description,
    source,
    url: source === "youtube" ? url : null,
    fileUrl: source === "file" ? file.url : null,
    thumbnail: thumbnail.url,
    featured,
    published,
  });

  return jsonOk({ videoId: video.id }, 201);
}
