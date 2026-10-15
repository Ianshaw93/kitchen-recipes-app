import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/us/horsemen", destination: "/us", permanent: false },
      { source: "/us/guide/horsemen", destination: "/us/guide", permanent: false },
    ];
  },
};

export default nextConfig;
