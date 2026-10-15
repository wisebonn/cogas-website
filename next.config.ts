import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;