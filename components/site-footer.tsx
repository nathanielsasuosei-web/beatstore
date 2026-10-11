import Link from "next/link";

export function SiteFooter({ settings }: { settings: Record<string, string> }) {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Store",
      links: [
        { href: "/beats", label: "All beats" },
        { href: "/videos", label: "Videos" },
        { href: "/licensing", label: "Licensing & FAQ" },
        { href: "/cart", label: "Cart" },
      ],
    },
    {
      title: "Studio",
      links: [
        { href: "/studio", label: "Book a session" },
        { href: "/about", label: "The producer" },
        { href: "/contact", label: "Custom work" },
        { href: "/account", label: "My downloads" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-ink-700 bg-ink-950">
      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mono-sm text-accent">Colophon</p>
            <p className="display mt-4 text-[clamp(2.5rem,7vw,5rem)] text-ash-50">
              {settings.site_name}
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ash-400">{settings.tagline}</p>

            <dl className="mt-8 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="mono-sm pt-1 text-ash-500">Producer</dt>
              <dd className="text-ash-200">{settings.producer_name}</dd>
              <dt className="mono-sm pt-1 text-ash-500">Based</dt>
              <dd className="text-ash-200">Accra, Ghana</dd>
              <dt className="mono-sm pt-1 text-ash-500">Bookings</dt>
              <dd className="text-ash-200">
                <a href={`mailto:${settings.support_email}`} className="link-accent">
                  {settings.support_email}
                </a>
              </dd>
              <dt className="mono-sm pt-1 text-ash-500">Phone</dt>
              <dd className="text-ash-200">
                <a
                  href={`tel:${settings.support_phone.replace(/\s/g, "")}`}
                  className="link-accent nums"
                >
                  {settings.support_phone}
                </a>
              </dd>
            </dl>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="arrow-link"
                >
                  Instagram
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
                  className="arrow-link"
                >
                  YouTube
                </a>
              )}
              {settings.tiktok && (
                <a
                  href={`https://tiktok.com/@${settings.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  className="arrow-link"
                >
                  TikTok
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="arrow-link"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="mono-sm border-b border-ink-700 pb-2 text-ash-500">{col.title}</p>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ash-300 transition-colors hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-ink-700">
        <div className="container-page flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-sm text-ash-600">
            © {year} {settings.site_name} — all beats remain the property of{" "}
            {settings.producer_name} until licensed.
          </p>
          <p className="mono-sm flex items-center gap-4 text-ash-600">
            <span>MoMo · Bank · Card</span>
            <Link href="/admin" className="transition-colors hover:text-ash-300">
              Producer login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
