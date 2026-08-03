import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@electric-sql/pglite"],
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
