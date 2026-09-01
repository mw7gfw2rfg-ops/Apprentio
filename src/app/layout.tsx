import type { Metadata } from "next";
import { Shantell_Sans, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl } from "@/lib/site-url";

// Self-hosted via next/font (built at compile time, no runtime request to
// fonts.googleapis.com) so the strict CSP (font-src 'self') never needs to
// change, even though the redesign's source design references the Google
// Fonts CDN directly.
const shantellSans = Shantell_Sans({
  variable: "--font-shantell-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Kept for the two genuinely-functional monospace uses (CV/cover-letter
// review textareas, the accent hex-color input) -- not part of the new
// design's visual language, just a legibility aid for editing raw text.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Apprentio",
  description: "Degree apprenticeship discovery and application tracking for UK sixth-formers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // next-themes sets class="dark"/"light" on <html> via a blocking
      // inline script that runs before hydration (that's what avoids a
      // flash of the wrong theme) -- React's server-rendered markup can
      // never match that, so this one element's mismatch is expected and
      // suppressed here specifically, not on body or anywhere else.
      suppressHydrationWarning
      className={`${shantellSans.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
