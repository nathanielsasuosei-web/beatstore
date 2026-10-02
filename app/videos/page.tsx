import type { Metadata } from "next";
import { listVideos } from "@/lib/data/catalog";
import { VideoGallery } from "@/components/video-gallery";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Videos",
  description: "Studio sessions, beat breakdowns and visuals from the producer.",
};

export default async function VideosPage() {
  const videos = listVideos();

  return (
    <div className="container-page py-12">
      <SectionHeading
        eyebrow="Behind the beats"
        title="Studio sessions & visuals"
        blurb="Watch how the beats are built — drum patterns, mix chains and the odd studio session."
      />
      <div className="mt-8">
        <VideoGallery
          videos={videos.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            source: v.source,
            url: v.url,
            fileUrl: v.fileUrl,
            thumbnail: v.thumbnail,
          }))}
        />
      </div>
    </div>
  );
}
