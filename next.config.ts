import type { NextConfig } from "next";
import packageJson from "./package.json";

const appVersion =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  packageJson.version;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "*.stellar.expert",
      },
    ],
  },
};

export default nextConfig;
