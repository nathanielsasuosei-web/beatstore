import { BeatForm } from "@/components/admin/beat-form";

export default function NewBeatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="headline text-2xl text-ash-50">Upload a beat</h1>
        <p className="mt-1 text-sm text-ash-400">
          Add the audio, cover art and the three licence prices. It goes live in the store the
          moment you publish.
        </p>
      </div>
      <BeatForm />
    </div>
  );
}
