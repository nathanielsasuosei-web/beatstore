import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads are served from the local storage folder through /api/media, so
  // image optimisation is switched off: no sharp dependency, and uploads behave
  // identically on any host. Serve pre-sized artwork (1200px+ squares look best).
  images: {
    unoptimized: true,
  },
  // Uploaded beats can be large; route handlers stream them to disk instead of
  // buffering the whole request in memory.
  experimental: {
    proxyTimeout: 120_000,
  },
  // The data layer reads the SQLite file and the uploads folder at runtime, so
  // keep those (plus the media archives) out of the server bundle.
  outputFileTracingExcludes: {
    "*": ["./storage/**/*", "./demo-assets/**/*", "./dev.db*", "./.next/cache/**/*"],
  },
};

export default nextConfig;
