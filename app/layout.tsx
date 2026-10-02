import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { PlayerProvider } from "@/components/player-provider";
import { PlayerBar } from "@/components/player-bar";

export const viewport: Viewport = {
  themeColor: "#0c0c0f",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = siteUrl();
  return {
    metadataBase: new URL(base),
    title: {
      default: `${settings.site_name} — buy Afrobeats, drill & amapiano beats`,
      template: `%s · ${settings.site_name}`,
    },
    description: settings.tagline,
    keywords: [
      "buy beats online",
      "afrobeats instrumentals",
      "amapiano beats",
      "afro drill type beat",
      "Ghana beats",
      "mobile money beats",
      settings.producer_name,
      settings.site_name,
    ],
    openGraph: {
      title: settings.site_name,
      description: settings.tagline,
      type: "website",
      url: base,
      siteName: settings.site_name,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.site_name,
      description: settings.tagline,
    },
    alternates: { canonical: base },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-ink-900 font-sans">
        <PlayerProvider>
          <CartProvider>
            <SiteHeader
              settings={settings}
              user={user ? { name: user.name, role: user.role } : null}
            />
            <main className="flex-1 pb-24">{children}</main>
            <SiteFooter settings={settings} />
            <CartDrawer />
            <PlayerBar />
          </CartProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
