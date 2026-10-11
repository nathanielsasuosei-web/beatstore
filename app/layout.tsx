import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import { getSettings } from "@/lib/settings";
import { themeFromSettings, themeStyle } from "@/lib/theme";
import { THEME_BOOTSTRAP } from "@/lib/theme-bootstrap";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeLauncher } from "@/components/theme-picker";
import { siteUrl } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { PlayerProvider } from "@/components/player-provider";
import { PlayerBar } from "@/components/player-bar";

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
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
  const studioTheme = themeFromSettings(settings);

  return (
    <html
      lang="en"
      className="h-full"
      data-surface={studioTheme.surface}
      style={themeStyle(studioTheme)}
      suppressHydrationWarning
    >
      <body className="grain min-h-full flex flex-col bg-ink-950 font-sans text-ash-100 antialiased">
        {/* Applies a returning visitor's saved colour before anything paints. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <ThemeProvider studioTheme={studioTheme}>
          <PlayerProvider>
            <CartProvider>
              <SiteHeader
                settings={settings}
                user={user ? { name: user.name, role: user.role } : null}
              />
              <main className="flex-1">{children}</main>
              <SiteFooter settings={settings} />
              <CartDrawer />
              <PlayerBar />
              <ThemeLauncher />
            </CartProvider>
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
