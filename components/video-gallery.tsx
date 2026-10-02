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
      <div className="surface-card grid place-items-center gap-2 py-16 text-center">
        <Play className="h-8 w-8 text-zinc-600" />
        <p className="text-sm text-zinc-400">No videos yet — check back soon.</p>
      </div>
    );
  }

  const embed = active?.source === "youtube" && active.url ? videoEmbedUrl(active.url) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <div className="surface-card overflow-hidden p-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
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
              <div className="grid h-full place-items-center text-sm text-zinc-500">
                This video has no source attached.
              </div>
            )}
          </div>
          {active && (
            <div className="px-2 pb-1 pt-4">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              {active.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{active.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActive(video)}
            className={`surface-card flex w-full items-center gap-3 p-3 text-left transition ${
              active?.id === video.id ? "border-lime-400/50 ring-1 ring-lime-400/20" : "hover:border-ink-600"
            }`}
          >
            <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-800">
              {video.thumbnail ? (
                <Image src={video.thumbnail} alt="" fill sizes="96px" className="object-cover" />
              ) : null}
              <span className="absolute inset-0 grid place-items-center bg-ink-950/40">
                <Play className="h-4 w-4 text-white" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{video.title}</span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {video.source === "youtube" ? "YouTube" : "Studio footage"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
