import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Photos des offres envoyées depuis l'espace pro (5 Mo maximum, vérifié côté serveur)
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [
      // photos de démonstration
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      // photos des offres hébergées dans Supabase Storage
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
