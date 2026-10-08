"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2, Upload, Video } from "lucide-react";
import { videoEmbedUrl } from "@/lib/utils";
import { safeJson } from "@/lib/api-client";

export type AdminVideo = {
  id: string;
  title: string;
  description: string | null;
  source: string;
  url: string | null;
  fileUrl: string | null;
  thumbnail: string | null;
  featured: boolean;
  published: boolean;
};

export function VideoManager({ videos }: { videos: AdminVideo[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    source: "youtube" as "youtube" | "file",
    url: "",
    featured: false,
    published: true,
  });
  const [file, setFile] = useState<File | undefined>();
  const [thumb, setThumb] = useState<File | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      data.set("title", form.title);
      data.set("description", form.description);
      data.set("source", form.source);
      data.set("url", form.url);
      data.set("featured", form.featured ? "on" : "off");
      data.set("published", form.published ? "true" : "false");
      if (file) data.set("video", file);
      if (thumb) data.set("thumbnail", thumb);

      const res = await fetch("/api/admin/videos", { method: "POST", body: data });
      const json = await safeJson(res);
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not save the video.");
      setForm({ title: "", description: "", source: "youtube", url: "", featured: false, published: true });
      setFile(undefined);
      setThumb(undefined);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/videos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this video?")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="surface-card h-fit p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Plus className="h-4 w-4 text-lime-400" /> Add a video
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="video-title">
              Title
            </label>
            <input
              id="video-title"
              required
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Studio session — Soft Life"
            />
          </div>
          <div>
            <label className="label" htmlFor="video-description">
              Description
            </label>
            <textarea
              id="video-description"
              rows={3}
              className="textarea resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Source</label>
            <div className="flex gap-2">
              {(["youtube", "file"] as const).map((source) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setForm({ ...form, source })}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs transition ${
                    form.source === source
                      ? "border-lime-400/60 bg-lime-400/10 text-lime-200"
                      : "border-ink-700 bg-ink-850 text-zinc-400"
                  }`}
                >
                  {source === "youtube" ? "YouTube / Vimeo link" : "Upload a file"}
                </button>
              ))}
            </div>
          </div>

          {form.source === "youtube" ? (
            <div>
              <label className="label" htmlFor="video-url">
                Video link
              </label>
              <input
                id="video-url"
                className="input"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
              {form.url && videoEmbedUrl(form.url) && (
                <p className="mt-1 text-[11px] text-lime-300">Recognised — will embed on the site.</p>
              )}
            </div>
          ) : (
            <div>
              <label className="label">Video file</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs"
              />
              <p className="mt-1 text-[11px] text-zinc-500">MP4 / MOV / WebM up to 600 MB.</p>
            </div>
          )}

          <div>
            <label className="label">Thumbnail (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumb(e.target.files?.[0])}
              className="input file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-lime-400"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-lime-400"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured
            </label>
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Save video
        </button>
      </form>

      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="surface-card flex gap-4 p-4">
            <span className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-ink-800">
              {video.thumbnail ? (
                <Image src={video.thumbnail} alt="" fill sizes="128px" className="object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-zinc-600">
                  <Video className="h-5 w-5" />
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{video.title}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {video.source === "youtube" ? video.url : video.fileUrl?.split("/").pop()}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => patch(video.id, { published: video.published ? "false" : "true" })}
                  className={`badge ${video.published ? "bg-lime-400/15 text-lime-300" : "bg-ink-700 text-zinc-400"}`}
                >
                  {video.published ? "Published" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => patch(video.id, { featured: video.featured ? "false" : "true" })}
                  className={`badge ${video.featured ? "bg-amber-500/15 text-amber-300" : "bg-ink-700 text-zinc-400"}`}
                >
                  {video.featured ? "Featured" : "Not featured"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(video.id)}
                  className="ml-auto text-zinc-500 hover:text-red-400"
                  aria-label="Delete video"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="surface-card grid place-items-center py-12 text-sm text-zinc-500">
            No videos yet.
          </div>
        )}
      </div>
    </div>
  );
}
