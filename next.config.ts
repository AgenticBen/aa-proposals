import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so Turbopack doesn't pick up the parent monorepo lockfile
    root: path.resolve(__dirname),
  },
  // Keep these server-only packages out of any client bundle
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
