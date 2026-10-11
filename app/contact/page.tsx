import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ask about a beat, a custom production, licensing or an existing order.",
};

export default async function ContactPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <div className="container-page py-12">
      <SectionHeading
        index="Get in touch"
        title="Talk to the producer directly"
        blurb="Custom beats, mixing, sync work, licence questions or an order that needs a hand — every message is read and answered by the producer."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ContactForm
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
          topics={[
            { id: "custom-beat", label: "Custom beat request" },
            { id: "general", label: "General enquiry" },
            { id: "support", label: "Support / problem with an order" },
            { id: "order", label: "Existing order" },
            { id: "licence", label: "Licensing question" },
            { id: "collab", label: "Collaboration / sync" },
          ]}
        />

        <div>
          <div className="border-t border-ink-600 pt-3">
            <p className="mono-sm text-ash-500">Direct lines</p>
            <dl className="mt-4">
              <div className="flex items-baseline justify-between border-b border-ink-800 py-2.5">
                <dt className="mono-sm text-ash-500">Email</dt>
                <dd className="text-sm text-ash-200">
                  <a href={`mailto:${settings.support_email}`} className="hover:text-accent-300">
                    {settings.support_email}
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-ink-800 py-2.5">
                <dt className="mono-sm text-ash-500">Phone</dt>
                <dd className="nums text-sm text-ash-200">
                  <a
                    href={`tel:${settings.support_phone.replace(/\s/g, "")}`}
                    className="hover:text-accent-300"
                  >
                    {settings.support_phone}
                  </a>
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-ink-800 py-2.5">
                <dt className="mono-sm text-ash-500">WhatsApp</dt>
                <dd className="nums text-sm text-ash-200">{settings.whatsapp}</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-ink-800 py-2.5">
                <dt className="mono-sm text-ash-500">Studio</dt>
                <dd className="text-sm text-ash-200">Accra, Ghana</dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-ink-800 py-2.5">
                <dt className="mono-sm text-ash-500">Replies</dt>
                <dd className="text-sm text-ash-200">Within a day, usually sooner</dd>
              </div>
            </dl>
          </div>

          <div className="mt-10 border-t border-ink-600 pt-3">
            <p className="mono-sm text-ash-500">Custom beat requests</p>
            <p className="mt-3 text-sm leading-relaxed text-ash-400">
              The fastest way to get a quote is to include: two reference tracks, the tempo or vibe
              you want, whether you need stems, and your deadline. Custom production starts from
              GH₵600.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ash-400">
              Already bought a beat and need something changed? Include the order reference (it
              looks like NSO-XXXXXX) and it gets looked at straight away.
            </p>
          </div>

          <div className="mt-10 border-t border-ink-600 pt-3">
            <p className="mono-sm text-ash-500">Order help</p>
            <p className="mt-3 text-sm leading-relaxed text-ash-400">
              Paid but no email? Check spam first, then{" "}
              <Link href="/account" className="link-accent">
                sign in to your dashboard
              </Link>{" "}
              — your downloads live there too. Still stuck? Send a message and the files get
              re-issued.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
