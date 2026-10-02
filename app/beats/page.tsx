import type { Metadata } from "next";
import { BeatExplorer } from "@/components/beat-explorer";
import { SectionHeading } from "@/components/section";
import { listBeats, beatGenres } from "@/lib/data/catalog";
import { MOODS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "All beats",
  description: "Stream every beat in the store and pick the licence that fits your release.",
};

export default async function BeatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = (q ?? "").trim();
  const { beats, total } = listBeats({ q: search || undefined, limit: 60 });
  const genres = beatGenres();

  return (
    <div className="container-page py-12">
      <SectionHeading
        eyebrow={`${total} beats in the store`}
        title="Find your next record"
        blurb="Previews are tagged, so you know exactly what the beat sounds like. Add a licence and check out with mobile money, bank transfer or card."
      />
      <div className="mt-8">
        <BeatExplorer
          initialBeats={beats}
          genres={genres}
          moods={[...MOODS]}
          initialTotal={total}
          initialQuery={search}
        />
      </div>
    </div>
  );
}
