import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
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
        eyebrow="Get in touch"
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

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h2 className="font-semibold">Direct lines</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-lime-400" />
                <a href={`mailto:${settings.support_email}`} className="hover:text-lime-300">
                  {settings.support_email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-lime-400" />
                <a href={`tel:${settings.support_phone.replace(/\s/g, "")}`} className="hover:text-lime-300">
                  {settings.support_phone}
                </a>
                <span className="text-xs text-zinc-500">(also WhatsApp: {settings.whatsapp})</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-lime-400" /> Accra, Ghana
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-lime-400" /> Replies within a day, usually much sooner
              </li>
            </ul>
          </div>

          <div className="surface-card p-5">
            <h2 className="font-semibold">Custom beat requests</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              The fastest way to get a quote is to include: two reference tracks, the tempo or vibe you want,
              whether you need stems, and your deadline. Custom production starts from GH₵600.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Already bought a beat and need something changed? Include the order reference (it looks like
              NSO-XXXXXX) and it gets looked at straight away.
            </p>
          </div>

          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-4 w-4 text-lime-400" /> Order help
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Paid but no email? Check spam first, then{" "}
              <Link href="/account" className="link-accent">
                sign in to your dashboard
              </Link>{" "}
              — your downloads live there too. Still stuck? Send a message and the files get re-issued.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
