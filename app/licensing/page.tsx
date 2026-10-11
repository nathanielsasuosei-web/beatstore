import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { TIER_META } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Licensing & FAQ",
  description:
    "Plain-English licence terms: what you can do with a basic, premium or exclusive beat, and answers to the usual questions.",
};

const MATRIX: {
  label: string;
  basic: string | boolean;
  premium: string | boolean;
  exclusive: string | boolean;
}[] = [
  {
    label: "Files delivered",
    basic: "MP3 320kbps",
    premium: "WAV + MP3",
    exclusive: "WAV + MP3 + stems",
  },
  { label: "Streams / views", basic: "Up to 10,000", premium: "Unlimited", exclusive: "Unlimited" },
  { label: "Monetise on YouTube", basic: false, premium: true, exclusive: true },
  { label: "Distribute to Spotify / Apple", basic: "Limited", premium: true, exclusive: true },
  { label: "Radio & DJ play", basic: false, premium: true, exclusive: true },
  { label: "Producer credit required", basic: true, premium: true, exclusive: false },
  { label: "Beat removed from store", basic: false, premium: false, exclusive: true },
  { label: "Free mix of your record", basic: false, premium: true, exclusive: true },
  { label: "Free master of your record", basic: false, premium: false, exclusive: true },
  { label: "Resell the beat itself", basic: false, premium: false, exclusive: false },
];

const FAQ = [
  {
    q: "How fast do I get my files?",
    a: "Card and mobile money payments made through the checkout release your download links instantly — the email usually lands before you've closed the tab. Mobile money and bank transfers done manually are verified by the producer, normally within the hour and always within the same working day.",
  },
  {
    q: "Which payment methods can I use?",
    a: "Paystack (card, and mobile money for supported currencies), plus direct MTN MoMo, Telecel Cash, AT Money and bank transfer to the account numbers shown at checkout. Each order gets a reference you can use as the payment reference.",
  },
  {
    q: "Do I have to create an account?",
    a: "No. You can check out as a guest and everything still arrives by email. Creating a free artist account keeps your downloads, receipts and licences in one dashboard for 30 days (and lets you re-download without digging through your inbox).",
  },
  {
    q: "Can I upgrade from basic to premium later?",
    a: "Yes — message the producer with your order reference and you only pay the difference. The upgrade is recorded against the same licence.",
  },
  {
    q: "What does 'exclusive' actually mean?",
    a: "You get exclusive rights to that instrumental: it is removed from the store immediately and will never be licensed to another artist. Ownership of the underlying composition stays with the producer unless a written transfer is signed.",
  },
  {
    q: "What if I need stems for mixing?",
    a: "Stems are included with exclusive licences and available on request for premium licences. Send the finished session details and the producer will prepare them.",
  },
  {
    q: "Can I get a custom beat instead?",
    a: "Absolutely. Custom beats start from GH₵600 depending on complexity and turnaround (usually 3–5 days, rush available). Send a reference and the vibe through the contact form.",
  },
  {
    q: "Do you offer refunds?",
    a: "Because the files are delivered digitally and instantly, purchases are final. If something is wrong with a file — corrupted download, missing stem, wrong licence name — it gets fixed or replaced immediately, just reply to your delivery email.",
  },
];

export default async function LicensingPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-12">
      <SectionHeading
        index="Licensing"
        title="One beat, three ways to release it"
        blurb="Every purchase generates a signed PDF licence agreement with your name, the beat details and the order reference on it. Here's exactly what each tier lets you do."
      />

      <div className="mt-10 overflow-x-auto border border-ink-700">
        <table className="table-clean min-w-[680px]">
          <thead>
            <tr>
              <th className="w-[30%]">Rights</th>
              {(["basic", "premium", "exclusive"] as const).map((tier) => (
                <th key={tier} scope="col">
                  <span
                    className={
                      tier === "premium"
                        ? "headline block text-sm normal-case tracking-normal text-accent-300"
                        : "headline block text-sm normal-case tracking-normal text-ash-100"
                    }
                  >
                    {TIER_META[tier].label}
                  </span>
                  <span className="mt-1 block text-sm normal-case tracking-normal text-ash-500">
                    from {formatMoney(TIER_META[tier].defaultPrice)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX.map((row) => (
              <tr key={row.label}>
                <td className="mono-sm text-ash-300">{row.label}</td>
                {(["basic", "premium", "exclusive"] as const).map((tier) => {
                  const value = row[tier];
                  return (
                    <td key={tier} className="text-sm text-ash-400">
                      {value === true ? (
                        <span className="inline-flex items-center gap-1.5 text-accent-300">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Yes
                        </span>
                      ) : value === false ? (
                        <span className="inline-flex items-center gap-1.5 text-ash-600">
                          <Minus className="h-3.5 w-3.5" strokeWidth={3} /> No
                        </span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mono-sm mt-3 text-ash-600">
        {TIER_META.basic.blurb} · {TIER_META.premium.blurb} · {TIER_META.exclusive.blurb}
      </p>

      <section className="mt-14">
        <SectionHeading index="FAQ" title="Everything else people ask" />
        <div className="mt-6 border-t border-ink-700 md:grid md:grid-cols-2 md:gap-x-10">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b border-ink-700">
              <summary className="flex cursor-pointer items-start justify-between gap-4 py-4 text-sm text-ash-100 marker:content-['']">
                <span className="headline">{item.q}</span>
                <span className="mono-sm shrink-0 text-accent group-open:hidden">Open</span>
                <span className="mono-sm hidden shrink-0 text-ash-500 group-open:block">Close</span>
              </summary>
              <p className="pb-5 pr-8 text-sm leading-relaxed text-ash-400">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-ink-700 pt-8">
        <div>
          <h3 className="headline text-lg text-ash-50">Still not sure which licence fits?</h3>
          <p className="mt-1 text-sm text-ash-400">
            Send the producer a message with your release plan — you&apos;ll get a straight answer,
            not a sales pitch.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/contact" className="btn btn-primary">
            Ask a question
          </Link>
          <Link href="/beats" className="btn btn-secondary">
            Browse beats
          </Link>
        </div>
      </div>

      <p className="mono-sm mt-6 text-ash-500">
        Questions about a specific order? Email {settings.support_email} with your order reference
        and it gets looked at the same day.
      </p>
    </div>
  );
}
