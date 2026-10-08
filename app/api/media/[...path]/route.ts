import { contentTypeFor, isPublicKind, MEDIA_KINDS, resolveStoredFile, type MediaKind } from "@/lib/storage";
import { apiHandler, serveFile } from "@/lib/http";
import { downloadIsUsable } from "@/lib/downloads";
import { getDownloadByToken } from "@/lib/data/sales";

type Params = { params: Promise<{ path: string[] }> };

/**
 * Serves uploaded media.
 *  - covers / previews / videos are public (cacheable)
 *  - beat files and stems require a valid `?token=` download link
 */
export const GET = apiHandler(async (request: Request, { params }: Params) => {
  const { path } = await params;
  const [kindRaw, ...rest] = path;
  const name = rest.join("/");

  if (!MEDIA_KINDS.includes(kindRaw as MediaKind) || !name || name.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const kind = kindRaw as MediaKind;
  const url = `/api/media/${kind}/${name}`;
  const filePath = resolveStoredFile(url);
  if (!filePath) return new Response("Not found", { status: 404 });

  const searchParams = new URL(request.url).searchParams;

  if (!isPublicKind(kind)) {
    const token = searchParams.get("token");
    if (!token) return new Response("Unauthorised", { status: 401 });
    const download = getDownloadByToken(token);
    if (!download) return new Response("Unauthorised", { status: 401 });

    const usable = downloadIsUsable(download);
    if (!usable.ok) return new Response(usable.reason, { status: 403 });
    if (download.fileUrl !== url) return new Response("Unauthorised", { status: 401 });

    return serveFile(request, { filePath, contentType: contentTypeFor(name) });
  }

  return serveFile(request, {
    filePath,
    contentType: contentTypeFor(name),
    cacheSeconds: 60 * 60 * 24 * 7,
  });
});
