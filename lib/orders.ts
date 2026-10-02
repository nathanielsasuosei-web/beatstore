import { getLicenseById, getBeatById } from "@/lib/data/catalog";
import { createOrder, createOrderItem } from "@/lib/data/sales";
import { getUserByEmail } from "@/lib/data/users";
import { randomRef } from "@/lib/utils";

export type CartLine = { beatId: string; licenseId: string };

export type ResolvedLine = {
  beat: {
    id: string;
    slug: string;
    title: string;
    coverImage: string | null;
    previewFile: string | null;
    audioFile: string | null;
    bpm: number | null;
    musicalKey: string | null;
    genre: string | null;
  };
  license: {
    id: string;
    tier: string;
    name: string;
    price: number;
    fileFormat: string | null;
  };
};

/**
 * Re-prices a cart entirely from the database. The browser never dictates
 * prices — a tampered cart simply resolves to whatever the DB says.
 */
export function resolveCart(lines: CartLine[]): { lines: ResolvedLine[]; subtotal: number } {
  const cleaned = lines
    .filter((l) => l && typeof l.beatId === "string" && typeof l.licenseId === "string")
    .slice(0, 20);

  const resolved: ResolvedLine[] = [];
  const seen = new Set<string>();

  for (const line of cleaned) {
    if (seen.has(line.licenseId)) continue;
    seen.add(line.licenseId);

    const license = getLicenseById(line.licenseId);
    if (!license || !license.active) continue;
    // the licence must belong to the beat the cart claims it does
    if (license.beatId !== line.beatId) continue;

    const beat = getBeatById(license.beatId);
    if (!beat || !beat.published) continue;

    resolved.push({
      beat: {
        id: beat.id,
        slug: beat.slug,
        title: beat.title,
        coverImage: beat.coverImage,
        previewFile: beat.previewFile,
        audioFile: beat.audioFile,
        bpm: beat.bpm,
        musicalKey: beat.musicalKey,
        genre: beat.genre,
      },
      license: {
        id: license.id,
        tier: license.tier,
        name: license.name,
        price: license.price,
        fileFormat: license.fileFormat,
      },
    });
  }

  const subtotal = resolved.reduce((sum, l) => sum + l.license.price, 0);
  return { lines: resolved, subtotal };
}

export function createPendingOrder({
  lines,
  customer,
  paymentMethod,
  note,
  currency = "GHS",
}: {
  lines: ResolvedLine[];
  customer: { name: string; email: string; phone?: string | null; country?: string | null };
  paymentMethod: string;
  note?: string | null;
  currency?: string;
}) {
  const subtotal = lines.reduce((sum, l) => sum + l.license.price, 0);
  const existingUser = getUserByEmail(customer.email);

  const order = createOrder({
    reference: randomRef("NSO"),
    userId: existingUser?.id ?? null,
    email: customer.email,
    name: customer.name,
    phone: customer.phone ?? null,
    country: customer.country ?? null,
    note: note ?? null,
    subtotal,
    total: subtotal,
    currency,
    status: "pending",
    paymentMethod,
  });

  for (const line of lines) {
    createOrderItem({
      orderId: order.id,
      beatId: line.beat.id,
      licenseId: line.license.id,
      title: line.beat.title,
      tier: line.license.tier,
      licenseName: line.license.name,
      price: line.license.price,
      currency,
      fileFormat: line.license.fileFormat,
    });
  }

  return { ...order, items: [] };
}
