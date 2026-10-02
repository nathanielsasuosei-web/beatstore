import { listVideos } from "@/lib/data/catalog";
import { VideoManager } from "@/components/admin/video-manager";

export default function AdminVideosPage() {
  const videos = listVideos(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste a YouTube link or upload studio footage. Videos appear on the public Videos page.
        </p>
      </div>
      <VideoManager
        videos={videos.map((video) => ({
          id: video.id,
          title: video.title,
          description: video.description,
          source: video.source,
          url: video.url,
          fileUrl: video.fileUrl,
          thumbnail: video.thumbnail,
          featured: video.featured,
          published: video.published,
        }))}
      />
    </div>
  );
}
