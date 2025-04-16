import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './')
    };
    return config;
  },
  // Use the newer configuration format
  experimental: {},
  // Explicitly set which router to use
  useFileSystemPublicRoutes: true
};

export default nextConfig;
