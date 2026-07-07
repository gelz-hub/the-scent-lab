import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/theme-provider";

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

export const metadata: Metadata = {
  title: "The Scent Lab — Curated Fragrances. Authentic Brands.",
  description:
    "The Scent Lab is a curated online retailer of authentic perfumes from the world's finest houses — Dior, Chanel, Tom Ford, Creed, Le Labo, Byredo and more. Discover your signature scent.",
  keywords: [
    "perfume",
    "fragrance",
    "cologne",
    "eau de parfum",
    "Dior",
    "Chanel",
    "Tom Ford",
    "Creed",
    "Le Labo",
    "Byredo",
    "niche perfume",
    "luxury fragrance",
  ],
  authors: [{ name: "The Scent Lab" }],
  openGraph: {
    title: "The Scent Lab — Curated Fragrances. Authentic Brands.",
    description:
      "A curated marketplace of authentic perfumes from the world's finest houses.",
    siteName: "The Scent Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Scent Lab",
    description: "Curated Fragrances. Authentic Brands.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
