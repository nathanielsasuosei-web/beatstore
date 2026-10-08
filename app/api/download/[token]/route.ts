import { downloadIsUsable, getDownloadContext, registerDownloadUse } from "@/lib/downloads";
import { contentTypeFor, resolveStoredFile } from "@/lib/storage";
import { apiHandler, serveFile } from "@/lib/http";

type Params = { params: Promise<{ token: string }> };

export const GET = apiHandler(async (request: Request, { params }: Params) => {
  const { token } = await params;
  const context = getDownloadContext(token);

  if (!context) {
    return new Response("This download link is not valid. Check your email for the right link.", { status: 404 });
  }

  const usable = downloadIsUsable(context.download);
  if (!usable.ok) return new Response(usable.reason, { status: 403 });

  const url = new URL(request.url);
  const wantsFile = url.searchParams.get("download") === "1";

  const filePath = resolveStoredFile(context.download.fileUrl);
  if (!filePath) {
    return new Response(
      "We couldn't find the file for this order. Please reply to your delivery email and we'll sort it out immediately.",
      { status: 410 }
    );
  }

  const ext = context.download.fileUrl?.split(".").pop() ?? "mp3";
  const safeTitle = `${context.item.title}-${context.item.tier}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, "-");

  if (wantsFile) {
    registerDownloadUse(context.download.id);
    return serveFile(request, {
      filePath,
      contentType: contentTypeFor(filePath),
      fileName: safeTitle,
      download: true,
    });
  }

  return serveFile(request, { filePath, contentType: contentTypeFor(filePath) });
});
