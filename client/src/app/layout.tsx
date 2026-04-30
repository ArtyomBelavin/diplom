import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AccessibilityPanel } from "@/components/accessibility-panel";
import { InteractionAnnouncer } from "@/components/interaction-announcer";
import { LiveRegion } from "@/components/live-region";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";
import { AccessibilityProvider } from "@/providers/accessibility-provider";
import { ReactQueryProvider } from "@/providers/query-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Adaptive Market",
  description: "Интернет-магазин устройств и аксессуаров для доступной среды.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${spaceGrotesk.variable} ${plexMono.variable}`}
    >
      <body className="site-body">
        <ReactQueryProvider>
          <AccessibilityProvider>
            <SkipLink />
            <LiveRegion />
            <InteractionAnnouncer />
            <div className="mx-auto min-h-screen max-w-[2160px] px-4 py-4 sm:px-6 xl:px-8 2xl:px-10">
              <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
                  <AccessibilityPanel />
                </aside>
                <div className="flex min-w-0 flex-col gap-6">
                  <Suspense fallback={null}>
                    <SiteHeader />
                  </Suspense>
                  <main className="grid gap-6" id="main-content">
                    {children}
                  </main>
                  <SiteFooter />
                </div>
              </div>
            </div>
          </AccessibilityProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
