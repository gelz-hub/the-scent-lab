import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { NotificationListener } from "@/components/notifications/notification-listener";
import { PushOnboardingBanner } from "@/components/notifications/push-onboarding-banner";
import { WishlistSync } from "@/components/account/wishlist-sync";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  // Base for resolving every relative URL below (OG images, canonical,
  // sitemap/robots entries) into an absolute one — required for social
  // previews and search engines, which don't understand relative URLs.
  metadataBase: new URL(siteUrl),
  title: "The Scent Lab — Curated Fragrances. Authentic Brands.",
  description:
    "The Scent Lab is a curated online retailer of authentic perfumes from the world's finest perfume houses. Discover your signature scent.",
  keywords: [
    "perfume",
    "fragrance",
    "cologne",
    "eau de parfum",
    "niche perfume",
    "luxury fragrance",
    "authentic perfume",
  ],
  authors: [{ name: "The Scent Lab" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The Scent Lab — Curated Fragrances. Authentic Brands.",
    description:
      "A curated marketplace of authentic perfumes from the world's finest houses.",
    siteName: "The Scent Lab",
    type: "website",
    url: siteUrl,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "The Scent Lab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Scent Lab",
    description: "Curated Fragrances. Authentic Brands.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <NotificationListener />
            <PushOnboardingBanner />
            <WishlistSync />
          </ThemeProvider>
        </SessionProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
