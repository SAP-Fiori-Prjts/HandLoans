import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/HandLoans",
  images: { unoptimized: true },
};

export default nextConfig;
