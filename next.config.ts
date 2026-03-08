import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/nasa/:path*",
        destination: "https://api.nasa.gov/neo/rest/v1/:path*",
      },
      {
        source: "/api/ollama/:path*",
        destination: "http://127.0.0.1:11434/api/:path*",
      },
    ];
  },
};

export default nextConfig;
