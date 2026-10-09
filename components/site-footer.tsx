import Link from "next/link";
import { AtSign, Headphones, Mail, Music2, Phone, PlayCircle } from "lucide-react";

export function SiteFooter({ settings }: { settings: Record<string, string> }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-ink-700 bg-ink-950">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-lime-300 to-emerald-500 text-ink-950">
              <Headphones className="h-4.5 w-4.5" strokeWidth={2.5} />
            </span>
            <span className="font-bold tracking-tight">{settings.site_name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">{settings.tagline}</p>
          <p className="mt-4 text-xs text-zinc-500">
            Beats by {settings.producer_name} · Accra, Ghana
          </p>
          <div className="mt-5 flex gap-2">
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                aria-label="Instagram"
              >
                <AtSign className="h-4 w-4" />
              </a>
            )}
            {settings.youtube && (
              <a
                href={
                  settings.youtube.startsWith("http")
                    ? settings.youtube
                    : `https://youtube.com/${settings.youtube}`
                }
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                aria-label="YouTube"
              >
                <PlayCircle className="h-4 w-4" />
              </a>
            )}
            {settings.tiktok && (
              <a
                href={`https://tiktok.com/@${settings.tiktok}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                aria-label="TikTok"
              >
                <Music2 className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Store</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
            <li><Link href="/beats" className="hover:text-lime-300">All beats</Link></li>
            <li><Link href="/videos" className="hover:text-lime-300">Videos</Link></li>
            <li><Link href="/studio" className="hover:text-lime-300">Book studio time</Link></li>
            <li><Link href="/licensing" className="hover:text-lime-300">Licensing &amp; FAQ</Link></li>
            <li><Link href="/cart" className="hover:text-lime-300">Cart</Link></li>
            <li><Link href="/account" className="hover:text-lime-300">My downloads</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Get in touch</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
            <li>
              <a href={`mailto:${settings.support_email}`} className="flex items-center gap-2 hover:text-lime-300">
                <Mail className="h-4 w-4" /> {settings.support_email}
              </a>
            </li>
            <li>
              <a href={`tel:${settings.support_phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-lime-300">
                <Phone className="h-4 w-4" /> {settings.support_phone}
              </a>
            </li>
            <li className="pt-1">
              <Link href="/contact" className="btn btn-secondary btn-sm">Send a message</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.site_name}. All beats remain the property of {settings.producer_name} until
            licensed.
          </p>
          <p className="flex items-center gap-3">
            <span>Mobile Money · Bank transfer · Card</span>
            <Link href="/admin" className="hover:text-zinc-300">Producer login</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
