import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
