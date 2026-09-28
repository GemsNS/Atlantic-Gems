import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RatesTicker } from "@/components/RatesTicker";
import { site } from "@/lib/site";

// Only the weights globals.css asks for (300 was never used): the heaviest rule
// is 700, which is Manrope's heaviest face here. Both families are variable
// fonts, so this trims @font-face rules, not downloads.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

// The italic is set once, on the stone family line in the gem explorer, so it
// is not preloaded: next/font would otherwise preload its file on every page.
// Same family name as above, so `--font-display` in italic picks it up.
const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-cormorant-italic",
  display: "swap",
  preload: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Fine Jewellery House, Halifax NS`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} | Fine Jewellery House, Halifax NS`,
    description: site.tagline,
    locale: "en_CA",
  },
  robots: { index: true, follow: true },
};

/**
 * Pages render per request so the CSP nonce issued by middleware is applied to
 * every inline script. Static prerendering cannot carry a per-request nonce.
 */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" className={`${cormorant.variable} ${cormorantItalic.variable} ${manrope.variable}`}>
      <body>
        {/* Reveal fades sections in from script; without it they would stay
            invisible, so show them as they are. */}
        <noscript>
          <style>{".reveal{opacity:1;transform:none}"}</style>
        </noscript>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <RatesTicker />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
