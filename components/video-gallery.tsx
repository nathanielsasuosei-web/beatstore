"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { videoEmbedUrl } from "@/lib/utils";

export type VideoItem = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string | null;
  fileUrl: string | null;
  thumbnail: string | null;
};

export function VideoGallery({ videos }: { videos: VideoItem[] }) {
  const [active, setActive] = useState<VideoItem | null>(videos[0] ?? null);

  if (!videos.length) {
    return (
      <div className="border border-dashed border-ink-600 py-16 text-center">
        <p className="mono-sm text-ash-500">Nothing uploaded</p>
        <p className="mt-2 text-sm text-ash-400">No videos yet — check back soon.</p>
      </div>
    );
  }

  const embed = active?.source === "youtube" && active.url ? videoEmbedUrl(active.url) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="border border-ink-700 bg-ink-850 p-3">
          <div className="relative aspect-video w-full overflow-hidden border border-ink-700 bg-black">
            {active && embed ? (
              <iframe
                key={active.id}
                src={embed}
                title={active.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : active?.fileUrl ? (
              <video
                key={active.id}
                src={active.fileUrl}
                controls
                playsInline
                poster={active.thumbnail ?? undefined}
                className="h-full w-full"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-ash-500">
                This video has no source attached.
              </div>
            )}
          </div>
          {active && (
            <div className="px-2 pb-1 pt-4">
              <h2 className="headline text-lg text-ash-50">{active.title}</h2>
              {active.description && (
                <p className="mt-2 text-sm leading-relaxed text-ash-400">{active.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ink-700">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActive(video)}
            className={`relative flex w-full items-center gap-3 border-b border-ink-700 py-3 text-left transition-colors ${
              active?.id === video.id ? "bg-ink-850" : "hover:bg-ink-850"
            }`}
          >
            {active?.id === video.id && (
              <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-accent" />
            )}
            <span className="relative h-16 w-24 shrink-0 overflow-hidden border border-ink-700 bg-ink-850">
              {video.thumbnail ? (
                <Image src={video.thumbnail} alt="" fill sizes="96px" className="object-cover" />
              ) : null}
              <span className="absolute inset-0 grid place-items-center bg-ink-950/40">
                <Play className="h-4 w-4 text-ash-50" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="headline block truncate text-sm text-ash-50">{video.title}</span>
              <span className="mono-sm mt-0.5 block text-ash-500">
                {video.source === "youtube" ? "YouTube" : "Studio footage"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
