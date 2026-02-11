import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Critical: Prevents Next.js from bundling the heavy C++ binaries
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;