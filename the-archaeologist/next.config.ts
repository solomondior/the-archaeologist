import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/cron/dig': ['./fixtures/**/*'],
    '/api/cron/fragment': ['./fixtures/**/*'],
  },
};

export default nextConfig;
