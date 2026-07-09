import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Account/admin/API/checkout are never useful to index and some
        // (checkout, account) contain no content search engines should see.
        disallow: ["/admin", "/account", "/api", "/checkout", "/maintenance"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
