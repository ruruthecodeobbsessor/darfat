import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Real destination pages take precedence when teammates add them.
      fallback: [
        { source: "/:locale/dashboard", destination: "/:locale/auth/ready" },
      ],
    };
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Profile photos (max 2MB) and post photos (max 5MB) are uploaded through Server Actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
