import { downloadIsUsable, getDownloadContext } from "@/lib/downloads";
import { buildLicensePdf } from "@/lib/license-pdf";
import { getSettings } from "@/lib/settings";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const context = getDownloadContext(token);
  if (!context) return new Response("Licence not found", { status: 404 });

  const usable = downloadIsUsable(context.download);
  if (!usable.ok) return new Response(usable.reason, { status: 403 });

  const settings = await getSettings();
  const { item, order, beat, download } = context;

  const pdf = await buildLicensePdf({
    producer: {
      name: settings.producer_name,
      email: settings.support_email,
      phone: settings.support_phone,
      country: "Ghana",
    },
    buyer: { name: order.name, email: order.email, phone: order.phone },
    order: {
      reference: order.reference,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      total: order.total,
      currency: order.currency,
    },
    item: {
      title: item.title,
      tier: item.tier,
      licenseName: item.licenseName,
      price: item.price,
      currency: item.currency,
      fileFormat: item.fileFormat,
    },
    beat: beat ? { bpm: beat.bpm, musicalKey: beat.musicalKey, genre: beat.genre } : null,
  });

  const fileName = `Licence-${order.reference}-${item.title.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
  const forceDownload = new URL(request.url).searchParams.get("download") === "1";

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Download-Id": download.id,
    },
  });
}
