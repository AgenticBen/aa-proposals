import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so Turbopack doesn't pick up the parent monorepo lockfile
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
