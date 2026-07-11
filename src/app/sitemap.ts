import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const staticRoutes = [
  "",
  "/shop",
  "/about",
  "/contact",
  "/best-sellers",
  "/new-arrivals",
  "/sale",
  "/men",
  "/women",
  "/unisex",
  "/brands",
  "/collections",
  "/privacy",
  "/terms",
  "/shipping",
  "/returns",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    // Only what's actually visible on the public storefront — never draft,
    // archived, or internal-only listings.
    where: { status: "ACTIVE", visibility: "PUBLIC" },
    select: { slug: true, updatedAt: true },
  });

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: new Date(),
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
    })),
  ];
}
