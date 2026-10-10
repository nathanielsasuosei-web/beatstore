import { notFound } from "next/navigation";
import { BeatForm } from "@/components/admin/beat-form";
import { getBeatById } from "@/lib/data/catalog";

export default async function EditBeatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const beat = getBeatById(id);
  if (!beat) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl text-ash-50">Edit “{beat.title}”</h1>
        <p className="mt-1 text-sm text-ash-400">
          Uploading a new file replaces the old one; licences that are unchecked simply stop being
          sold.
        </p>
      </div>
      <BeatForm
        initial={{
          id: beat.id,
          title: beat.title,
          description: beat.description ?? "",
          genre: beat.genre ?? "Afrobeats",
          mood: beat.mood ?? "Bouncy",
          bpm: beat.bpm ? String(beat.bpm) : "",
          musicalKey: beat.musicalKey ?? "C min",
          tags: beat.tags ?? "",
          featured: beat.featured,
          published: beat.published,
          coverImage: beat.coverImage,
          audioFile: beat.audioFile,
          previewFile: beat.previewFile,
          stemsFile: beat.stemsFile,
          licenses: beat.licenses.map((license) => ({
            tier: license.tier,
            name: license.name,
            price: license.price,
            fileFormat: license.fileFormat ?? "",
            description: license.description ?? "",
            active: license.active,
            popular: license.popular,
          })),
        }}
      />
    </div>
  );
}
