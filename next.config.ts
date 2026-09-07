import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gmkzcxvgbhhvznbkxlae.supabase.co",
      },
    ],
  },
};

export default nextConfig;