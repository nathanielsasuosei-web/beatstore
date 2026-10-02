import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { Readable } from "node:stream";

type ServeOptions = {
  filePath: string;
  contentType: string;
  fileName?: string;
  download?: boolean;
  cacheSeconds?: number;
};

/**
 * Streams a file from disk with HTTP range support so audio/video scrubbing
 * works in browsers, and long files don't blow up memory.
 */
export async function serveFile(request: Request, options: ServeOptions): Promise<Response> {
  const { filePath, contentType, fileName, download, cacheSeconds = 0 } = options;

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return new Response("File not found", { status: 404 });
  }
  if (!stat.isFile()) return new Response("Not a file", { status: 404 });

  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheSeconds > 0 ? `public, max-age=${cacheSeconds}` : "private, no-store",
  });
  if (download) {
    const name = (fileName ?? "download").replace(/["\\\r\n]/g, "");
    headers.set("Content-Disposition", `attachment; filename="${name}"`);
  }

  const range = request.headers.get("range");
  if (range) {
    const match = range.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Number.parseInt(match[2], 10) : stat.size - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
        return new Response("Range not satisfiable", {
          status: 416,
          headers: { "Content-Range": `bytes */${stat.size}` },
        });
      }
      const safeEnd = Math.min(end, stat.size - 1);
      const chunkSize = safeEnd - start + 1;
      headers.set("Content-Range", `bytes ${start}-${safeEnd}/${stat.size}`);
      headers.set("Content-Length", String(chunkSize));
      const stream = Readable.toWeb(createReadStream(filePath, { start, end: safeEnd })) as ReadableStream;
      return new Response(stream, { status: 206, headers });
    }
  }

  headers.set("Content-Length", String(stat.size));
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
