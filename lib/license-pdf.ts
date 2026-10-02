import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { toMajor } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export type LicensePdfInput = {
  producer: { name: string; email: string; phone: string; country?: string };
  buyer: { name: string; email: string; phone?: string | null };
  order: { reference: string; paidAt: Date | null; createdAt: Date; total: number; currency: string };
  item: {
    title: string;
    tier: string;
    licenseName: string;
    price: number;
    currency: string;
    fileFormat?: string | null;
  };
  beat?: { bpm?: number | null; musicalKey?: string | null; genre?: string | null } | null;
};

const TIER_TERMS: Record<string, string[]> = {
  basic: [
    "Non-exclusive licence. The instrumental is leased, not sold - the producer keeps full ownership of the composition and master.",
    "Permitted use: up to 10,000 streams/views across all platforms, non-monetised or lightly monetised independent releases, demos, mixtapes and live performances.",
    "You may not monetise the release on Content ID, distribute more than 10,000 units, or claim authorship of the instrumental.",
    "Delivered format: untagged MP3 320kbps.",
    "Producer credit must appear as 'Prod. by [Producer]' in the track title or description.",
  ],
  premium: [
    "Non-exclusive licence. The instrumental is leased, not sold - the producer keeps full ownership of the composition and master.",
    "Permitted use: unlimited streams/views on streaming platforms, monetised YouTube, content ID registration of your vocal recording only, radio and DJ play.",
    "You may not resell or redistribute the instrumental itself, or register the instrumental as your own work.",
    "Delivered formats: untagged WAV + MP3 320kbps.",
    "Producer credit must appear as 'Prod. by [Producer]' in the track title or description. One free mix of the finished record is included.",
  ],
  exclusive: [
    "Exclusive licence: the producer grants you exclusive rights to the instrumental and will remove it from sale. The beat will not be licensed to anyone else from the date of purchase.",
    "Permitted use: unlimited commercial exploitation of the record, including streaming, sales, sync, broadcast and derivative works.",
    "Ownership of the underlying composition remains with the producer unless a separate written transfer is signed; this licence grants the exclusive rights described above.",
    "Delivered formats: untagged WAV + MP3 320kbps + trackout/stems on request.",
    "Producer credit is appreciated but optional. One free mix and one free master of the finished record are included.",
  ],
};

const DEFAULT_TERMS = [
  "This licence grants a limited right to use the instrumental described above under the terms of the tier purchased.",
  "The producer retains ownership of the instrumental. This document is your proof of licence - keep it safe.",
];

export async function buildLicensePdf(input: LicensePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const ink = rgb(0.09, 0.09, 0.11);
  const muted = rgb(0.42, 0.42, 0.46);
  const accent = rgb(0.55, 0.79, 0.24);
  const line = rgb(0.87, 0.87, 0.89);

  const clean = (s: string) => sanitize(s);

  // Header band
  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: rgb(0.05, 0.05, 0.06) });
  page.drawRectangle({ x: 0, y: height - 100, width, height: 4, color: accent });

  page.drawText(clean(input.producer.name.toUpperCase()), {
    x: 48,
    y: height - 52,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(clean(`${input.producer.email}${input.producer.phone ? `  |  ${input.producer.phone}` : ""}`), {
    x: 48,
    y: height - 72,
    size: 9.5,
    font,
    color: rgb(0.72, 0.72, 0.76),
  });
  page.drawText("MUSIC LICENCE AGREEMENT", { x: 48, y: height - 136, size: 20, font: bold, color: ink });
  page.drawText(clean(`Licence no. ${input.order.reference}-${input.item.tier.toUpperCase()}`), {
    x: 48,
    y: height - 154,
    size: 10,
    font,
    color: muted,
  });
  page.drawLine({
    start: { x: 48, y: height - 172 },
    end: { x: width - 48, y: height - 172 },
    thickness: 1,
    color: line,
  });

  let y = height - 202;

  const sectionTitle = (text: string) => {
    page.drawText(clean(text.toUpperCase()), { x: 48, y, size: 9.5, font: bold, color: muted });
    y -= 16;
  };

  const row = (label: string, value: string) => {
    page.drawText(clean(label), { x: 48, y, size: 10.5, font, color: muted });
    page.drawText(clean(value), { x: 210, y, size: 10.5, font: bold, color: ink });
    y -= 17;
  };

  const paragraph = (text: string, size = 10, indent = 0) => {
    const words = clean(text).split(" ");
    const maxWidth = width - 96 - indent;
    let currentLine = "";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        page.drawText(currentLine, { x: 48 + indent, y, size, font, color: ink });
        y -= size + 4.5;
        currentLine = word;
      } else {
        currentLine = test;
      }
      if (y < 110) break;
    }
    if (currentLine && y >= 110) {
      page.drawText(currentLine, { x: 48 + indent, y, size, font, color: ink });
      y -= size + 8;
    }
  };

  sectionTitle("1. Parties");
  row("Licensor (Producer)", input.producer.name);
  row("Licensee (Artist)", input.buyer.name);
  row("Licensee email", input.buyer.email);
  if (input.buyer.phone) row("Licensee phone", input.buyer.phone);
  y -= 8;

  sectionTitle("2. The recording");
  row("Instrumental title", input.item.title);
  row("Licence type", input.item.licenseName);
  if (input.beat?.bpm) row("Tempo", `${input.beat.bpm} BPM`);
  if (input.beat?.musicalKey) row("Key", input.beat.musicalKey);
  if (input.beat?.genre) row("Genre", input.beat.genre);
  row("Delivered files", input.item.fileFormat || "See licence tier");
  y -= 8;

  sectionTitle("3. Payment");
  row("Order reference", input.order.reference);
  row("Amount paid", `${input.item.currency} ${toMajor(input.item.price).toFixed(2)}`);
  row(
    "Date of payment",
    formatDate(input.order.paidAt ?? input.order.createdAt)
  );
  y -= 8;

  sectionTitle("4. Grant of rights and restrictions");
  const terms = TIER_TERMS[input.item.tier] ?? DEFAULT_TERMS;
  terms.forEach((term, index) => {
    if (y < 130) return;
    page.drawText(`${index + 1}.`, { x: 48, y, size: 10, font: bold, color: accent });
    paragraph(term, 10, 18);
  });

  // Signature block
  const sigY = 108;
  page.drawLine({ start: { x: 48, y: sigY + 42 }, end: { x: width - 48, y: sigY + 42 }, thickness: 1, color: line });
  page.drawText(clean(`Signed electronically on behalf of ${input.producer.name}`), {
    x: 48,
    y: sigY + 24,
    size: 9.5,
    font: italic,
    color: muted,
  });
  page.drawText("Licensor", { x: 48, y: sigY + 6, size: 9, font: bold, color: ink });
  page.drawText("Licensee (acceptance of the paid order)", { x: 300, y: sigY + 6, size: 9, font: bold, color: ink });
  page.drawText(
    clean("This agreement is generated automatically at the moment of purchase and is valid without a handwritten signature."),
    { x: 48, y: 34, size: 8, font, color: muted }
  );

  return doc.save();
}

/** Standard PDF fonts only cover Latin-1; strip anything else so we never throw. */
function sanitize(value: string) {
  return (value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}
