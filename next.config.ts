import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@electric-sql/pglite"],
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
