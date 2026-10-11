"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, Save, Trash2, Upload } from "lucide-react";
import { GENRES, KEYS, MOODS, TIER_META, type LicenseTier } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn, previewIsPlayable } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

export type BeatFormValues = {
  id?: string;
  title: string;
  description: string;
  genre: string;
  mood: string;
  bpm: string;
  musicalKey: string;
  tags: string;
  featured: boolean;
  published: boolean;
  coverImage: string | null;
  audioFile: string | null;
  previewFile: string | null;
  stemsFile: string | null;
  licenses: {
    tier: string;
    name: string;
    price: number; // minor units
    fileFormat: string;
    description: string;
    active: boolean;
    popular: boolean;
  }[];
};

const EMPTY: BeatFormValues = {
  title: "",
  description: "",
  genre: "Afrobeats",
  mood: "Bouncy",
  bpm: "",
  musicalKey: "C min",
  tags: "",
  featured: false,
  published: true,
  coverImage: null,
  audioFile: null,
  previewFile: null,
  stemsFile: null,
  licenses: (Object.keys(TIER_META) as LicenseTier[]).map((tier) => ({
    tier,
    name: TIER_META[tier].label,
    price: TIER_META[tier].defaultPrice,
    fileFormat: TIER_META[tier].files,
    description: TIER_META[tier].blurb,
    active: true,
    popular: tier === "premium",
  })),
};

export function BeatForm({ initial }: { initial?: BeatFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BeatFormValues>(initial ?? EMPTY);
  const [files, setFiles] = useState<{ cover?: File; audio?: File; preview?: File; stems?: File }>(
    {},
  );
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const editing = Boolean(values.id);

  // A preview is playable in the store unless it points into a protected
  // folder. Beats saved before this rule may point at their beat master file.
  const hasPlayablePreview = Boolean(files.preview) || previewIsPlayable(values.previewFile);

  function set<K extends keyof BeatFormValues>(key: K, value: BeatFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setLicense(tier: string, patch: Partial<BeatFormValues["licenses"][number]>) {
    setValues((current) => ({
      ...current,
      licenses: current.licenses.map((license) =>
        license.tier === tier ? { ...license, ...patch } : license,
      ),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setProgress("Uploading files…");

    try {
      if (!values.title.trim()) throw new Error("Give the beat a title.");
      if (!editing && !files.audio) throw new Error("Upload the beat file buyers will receive.");
      if (values.published && !hasPlayablePreview) {
        throw new Error(
          "Upload a public preview clip (30–45s) before publishing — beat files are protected, so visitors cannot hear them.",
        );
      }

      const form = new FormData();
      form.set("title", values.title);
      form.set("description", values.description);
      form.set("genre", values.genre);
      form.set("mood", values.mood);
      form.set("bpm", values.bpm);
      form.set("musicalKey", values.musicalKey);
      form.set("tags", values.tags);
      form.set("featured", values.featured ? "on" : "off");
      form.set("published", values.published ? "true" : "false");
      form.set("removeCover", removeCover ? "true" : "false");
      form.set(
        "licenses",
        JSON.stringify(
          values.licenses
            .filter((license) => license.active)
            .map((license, index) => ({
              tier: license.tier,
              name: license.name,
              // form shows major units, the API stores minor units
              price: license.price / 100,
              description: license.description,
              fileFormat: license.fileFormat,
              active: license.active,
              popular: license.popular,
              sortOrder: index,
            })),
        ),
      );

      if (files.cover) form.set("cover", files.cover);
      if (files.audio) form.set("audio", files.audio);
      if (files.preview) form.set("preview", files.preview);
      if (files.stems) form.set("stems", files.stems);

      const res = await fetch(editing ? `/api/admin/beats/${values.id}` : "/api/admin/beats", {
        method: editing ? "PATCH" : "POST",
        body: form,
      });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not save the beat.");
      router.push("/admin/beats");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
      setProgress("");
    }
  }

  async function destroy() {
    if (!values.id) return;
    if (!window.confirm("Delete this beat? Beats with sales are unpublished instead.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/beats/${values.id}`, { method: "DELETE" });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not delete.");
      router.push("/admin/beats");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Beat details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  required
                  className="input"
                  value={values.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Midnight in Accra"
                />
              </div>
              <div>
                <label className="label" htmlFor="genre">
                  Genre
                </label>
                <select
                  id="genre"
                  className="select"
                  value={values.genre}
                  onChange={(e) => set("genre", e.target.value)}
                >
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="mood">
                  Mood
                </label>
                <select
                  id="mood"
                  className="select"
                  value={values.mood}
                  onChange={(e) => set("mood", e.target.value)}
                >
                  {MOODS.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="bpm">
                  BPM
                </label>
                <input
                  id="bpm"
                  type="number"
                  min={40}
                  max={220}
                  className="input"
                  value={values.bpm}
                  onChange={(e) => set("bpm", e.target.value)}
                  placeholder="102"
                />
              </div>
              <div>
                <label className="label" htmlFor="musicalKey">
                  Key
                </label>
                <select
                  id="musicalKey"
                  className="select"
                  value={values.musicalKey}
                  onChange={(e) => set("musicalKey", e.target.value)}
                >
                  {KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="tags">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  className="input"
                  value={values.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="afrobeats, accra, night drive"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="textarea resize-y"
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the vibe, instrumentation and what kind of artist it suits."
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-accent-400"
                  checked={values.published}
                  onChange={(e) => set("published", e.target.checked)}
                />
                Published (visible in the store)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-accent-400"
                  checked={values.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                />
                Feature on the homepage
              </label>
            </div>
          </section>

          <section className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Licence pricing</h2>
            <p className="mt-1 text-xs text-ash-500">
              Prices are in {`GH₵`} (the store currency). Uncheck a tier to stop selling it.
            </p>
            <div className="mt-4 space-y-4">
              {values.licenses.map((license) => (
                <div key={license.tier} className=" border border-ink-700 bg-ink-850 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-ink-700 text-ash-300">{license.tier}</span>
                      <input
                        className="input h-9 w-48"
                        value={license.name}
                        onChange={(e) => setLicense(license.tier, { name: e.target.value })}
                        aria-label={`${license.tier} licence name`}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-accent-400"
                          checked={license.active}
                          onChange={(e) => setLicense(license.tier, { active: e.target.checked })}
                        />
                        Sell
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-accent-400"
                          checked={license.popular}
                          onChange={(e) => setLicense(license.tier, { popular: e.target.checked })}
                        />
                        Most popular
                      </label>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="label">Price (GHS)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="input"
                        value={(license.price / 100).toString()}
                        onChange={(e) =>
                          setLicense(license.tier, {
                            price: Math.round(Number(e.target.value) * 100),
                          })
                        }
                      />
                      <p className="mt-1 text-[11px] text-ash-500">
                        Displays as {formatMoney(license.price)}
                      </p>
                    </div>
                    <div>
                      <label className="label">Files delivered</label>
                      <input
                        className="input"
                        value={license.fileFormat}
                        onChange={(e) => setLicense(license.tier, { fileFormat: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Terms summary</label>
                      <input
                        className="input"
                        value={license.description}
                        onChange={(e) => setLicense(license.tier, { description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Files</h2>

            <div className="mt-4">
              <label className="label">Cover artwork</label>
              <div className="flex items-center gap-3">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden bg-ink-800">
                  {!removeCover && (files.cover || values.coverImage) ? (
                    <Image
                      src={
                        files.cover
                          ? URL.createObjectURL(files.cover)
                          : (values.coverImage as string)
                      }
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-xs text-ash-600">
                      none
                    </span>
                  )}
                </span>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setFiles({ ...files, cover: e.target.files?.[0] });
                      setRemoveCover(false);
                    }}
                    className="input file:mr-3 file: file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs file:text-ash-200"
                  />
                  {values.coverImage && (
                    <button
                      type="button"
                      onClick={() => setRemoveCover((v) => !v)}
                      className="mt-2 text-xs text-ash-500 hover:text-accent"
                    >
                      {removeCover ? "Keep existing cover" : "Remove cover on save"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <FileField
              label="Beat file (delivered to buyer)"
              hint="MP3 / WAV / FLAC up to 400 MB"
              accept=".mp3,.wav,.flac,.aiff,.aif,.m4a,.ogg,audio/*"
              current={values.audioFile}
              onPick={(file) => setFiles({ ...files, audio: file })}
            />
            <FileField
              label="Public preview (tagged, 30–45s)"
              hint="Required — this is what visitors hear. Beat files are protected, so the store plays this clip instead."
              accept=".mp3,.wav,.m4a,.ogg,audio/*"
              current={hasPlayablePreview ? values.previewFile : null}
              onPick={(file) => setFiles({ ...files, preview: file })}
            />
            {!hasPlayablePreview && values.previewFile && (
              <p className="mt-2 flex items-start gap-2 border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-300">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                This beat still points at its protected master file, so the store has no playable
                preview. Upload a clip above to fix it.
              </p>
            )}
            <FileField
              label="Stems / trackout zip (exclusive)"
              hint="ZIP up to 800 MB"
              accept=".zip,.rar,.7z"
              current={values.stemsFile}
              onPick={(file) => setFiles({ ...files, stems: file })}
            />
          </section>

          <section className="surface-card p-5">
            <h2 className="headline text-sm text-ash-50">Save</h2>
            {error && (
              <p className="mt-3 flex items-start gap-2 border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
              </p>
            )}
            {progress && <p className="mt-3 text-xs text-ash-400">{progress}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary btn-lg mt-4 w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Save changes" : "Publish beat"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={destroy}
                disabled={busy}
                className="btn btn-danger mt-2 w-full"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete beat
              </button>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-ash-500">
              Large files upload straight to the server&apos;s storage folder. On a fresh clone,
              <code className="mx-1 rounded bg-ink-800 px-1">npm run media:demo</code> generates
              sample audio if you want something to test with.
            </p>
          </section>
        </div>
      </div>
    </form>
  );
}

function FileField({
  label,
  hint,
  accept,
  current,
  onPick,
}: {
  label: string;
  hint: string;
  accept: string;
  current: string | null;
  onPick: (file?: File) => void;
}) {
  const [name, setName] = useState<string | null>(null);

  return (
    <div className="mt-5">
      <label className="label">{label}</label>
      {current && (
        <p className="mb-2 truncate text-xs text-ash-500">
          Current: <span className="text-ash-300">{current.split("/").pop()}</span>
        </p>
      )}
      <div className={cn("flex items-center gap-2", !current && "text-ash-400")}>
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            onPick(file);
            setName(file?.name ?? null);
          }}
          className="input file:mr-3 file: file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs file:text-ash-200"
        />
      </div>
      <p className="mt-1 text-[11px] text-ash-500">
        {name ? (
          <span className="text-accent-300">
            <Upload className="mr-1 inline h-3 w-3" />
            {name} ready to upload
          </span>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}
