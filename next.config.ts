import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
