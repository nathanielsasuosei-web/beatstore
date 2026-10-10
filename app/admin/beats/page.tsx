import Link from "next/link";
import Image from "next/image";
import { Edit3, Plus, TrendingUp } from "lucide-react";
import { listBeats } from "@/lib/data/catalog";
import { ordersUsingBeat } from "@/lib/data/sales";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDuration, parseTags } from "@/lib/utils";

export default function AdminBeatsPage() {
  const { beats, total } = listBeats({ includeUnpublished: true, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-2xl text-ash-50">Beats</h1>
          <p className="mt-1 text-sm text-ash-400">
            {total} beat{total === 1 ? "" : "s"} in the catalogue —{" "}
            {beats.filter((b) => b.published).length} live in the store.
          </p>
        </div>
        <Link href="/admin/beats/new" className="btn btn-primary btn-sm">
          <Plus className="h-3.5 w-3.5" /> Upload beat
        </Link>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="table-clean min-w-[900px]">
          <thead>
            <tr>
              <th>Beat</th>
              <th>Details</th>
              <th>Licences</th>
              <th>Sales</th>
              <th>Plays</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {beats.map((beat) => {
              const lowest = beat.licenses.length
                ? Math.min(...beat.licenses.map((l) => l.price))
                : 0;
              return (
                <tr key={beat.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden bg-ink-800">
                        {beat.coverImage ? (
                          <Image
                            src={beat.coverImage}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{beat.title}</span>
                        <span className="block text-xs text-ash-500">
                          {parseTags(beat.tags).slice(0, 3).join(", ") || "no tags"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="text-xs text-ash-400">
                    <div>{[beat.genre, beat.mood].filter(Boolean).join(" · ")}</div>
                    <div>
                      {[
                        beat.bpm ? `${beat.bpm} BPM` : null,
                        beat.musicalKey,
                        beat.duration ? formatDuration(beat.duration) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="text-ash-600">{formatDate(beat.createdAt)}</div>
                  </td>
                  <td className="text-xs">
                    {beat.licenses.map((license) => (
                      <div
                        key={license.id}
                        className={license.active ? "text-ash-300" : "text-ash-600 line-through"}
                      >
                        {license.tier}: {formatMoney(license.price)}
                      </div>
                    ))}
                    {beat.licenses.length > 0 && (
                      <div className="mt-1 text-[11px] text-ash-500">
                        from {formatMoney(lowest)}
                      </div>
                    )}
                  </td>
                  <td className="text-sm">{ordersUsingBeat(beat.id)}</td>
                  <td className="text-sm text-ash-400">{beat.plays.toLocaleString()}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`badge ${beat.published ? "bg-accent-400/15 text-accent-300" : "bg-ink-700 text-ash-400"}`}
                      >
                        {beat.published ? "Live" : "Hidden"}
                      </span>
                      {beat.featured && (
                        <span className="badge bg-amber-500/15 text-amber-300">
                          <TrendingUp className="h-3 w-3" /> Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/beats/${beat.id}`} className="btn btn-secondary btn-sm">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {beats.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-ash-500">
                  No beats yet — upload the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
