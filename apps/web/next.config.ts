import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@watchdog/shared", "@watchdog/db"],
  serverExternalPackages: ["pg-boss", "postgres"],
};

export default nextConfig;
