import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Use this project as root so Next doesn’t pick a lockfile from your home dir
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
