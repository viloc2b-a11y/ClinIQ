import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // If a parent directory has another package-lock.json, this pins the Turbopack root to this app.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
