import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@achrili/api", "@achrili/shared", "@achrili/validation"]
};

export default nextConfig;
