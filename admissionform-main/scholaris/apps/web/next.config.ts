import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@electric-sql/pglite"],
};

export default nextConfig;
