import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      // Real destination pages take precedence when teammates add them.
      fallback: [
        { source: "/dashboard", destination: "/auth/ready" },
        { source: "/admin", destination: "/auth/ready" },
      ],
    };
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Profile photos (max 2MB) are uploaded through a Server Action.
    serverActions: { bodySizeLimit: "3mb" },
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
