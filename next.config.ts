import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  typescript: {
    // TypeScript hatalarını build sırasında görmezden gel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
