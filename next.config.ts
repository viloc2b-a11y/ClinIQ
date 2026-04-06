import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins Turbopack root to this app when a parent dir has another package-lock.json
  turbopack: {
    root: process.cwd(),
  },
  // Fix node:fs errors caused by pdfjs-dist and xlsx being bundled client-side
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        "node:fs": false,
        "node:fs/promises": false,
        path: false,
        "node:path": false,
        os: false,
        "node:os": false,
        crypto: false,
        "node:crypto": false,
        stream: false,
        "node:stream": false,
        buffer: false,
        "node:buffer": false,
      };
    }
    return config;
  },
};

export default nextConfig;
