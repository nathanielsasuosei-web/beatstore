import {
  createDownloadRecord,
  downloadForItem,
  getDownloadByToken,
  getOrderById,
  orderItems,
  registerDownload,
} from "@/lib/data/sales";
import { getBeatById } from "@/lib/data/catalog";
import { makeToken } from "@/lib/auth";
import { DOWNLOAD_MAX, DOWNLOAD_TTL_DAYS } from "@/lib/constants";
import type { Download } from "@/lib/data/types";

export type DownloadContext = {
  download: Download;
  order: NonNullable<ReturnType<typeof getOrderById>>;
  item: ReturnType<typeof orderItems>[number];
  beat: ReturnType<typeof getBeatById>;
};

/** Everything a download / licence page needs, in one lookup. */
export function getDownloadContext(token: string): DownloadContext | null {
  const download = getDownloadByToken(token);
  if (!download) return null;
  const order = getOrderById(download.orderId);
  if (!order) return null;
  const item = order.items.find((i) => i.id === download.orderItemId);
  if (!item) return null;
  const beat = item.beatId ? getBeatById(item.beatId) : null;
  return { download, order, item, beat };
}

/** Creates (or reuses) one secure download record per purchased item. */
export function createDownloadsForOrder(orderId: string, userId?: string | null) {
  const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_DAYS * 24 * 60 * 60 * 1000);
  const items = orderItems(orderId);
  const created: Download[] = [];

  for (const item of items) {
    const existing = downloadForItem(item.id);
    if (existing) {
      created.push(existing);
      continue;
    }
    const token = makeToken(24);
    const beat = item.beatId ? getBeatById(item.beatId) : null;
    created.push(
      createDownloadRecord({
        token,
        orderId,
        orderItemId: item.id,
        userId: userId ?? null,
        fileUrl: beat?.audioFile ?? null,
        licenseUrl: `/api/download/${token}/license`,
        maxDownloads: DOWNLOAD_MAX,
        expiresAt,
      })
    );
  }

  return created;
}

export function downloadIsUsable(download: { expiresAt: Date; downloads: number; maxDownloads: number }) {
  if (download.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "This download link has expired." };
  }
  if (download.downloads >= download.maxDownloads) {
    return { ok: false as const, reason: "This download link has reached its download limit." };
  }
  return { ok: true as const };
}

export function registerDownloadUse(downloadId: string) {
  registerDownload(downloadId);
}

export function deliveryUrlForToken(token: string) {
  return `/download/${token}`;
}

export { getDownloadByToken };
