import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El repo ya tiene su documentación; no hace falta que Next regenere AGENTS.md.
  agentRules: false,
};

export default nextConfig;
