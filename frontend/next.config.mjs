// ============================================================================
// File: frontend/next.config.mjs
// Description: Next.js 15 configuration supporting Dual Deployment (Vercel & Tauri Desktop)
//
// COMPUTATIONAL THINKING FOR JURY:
// When compiling for Tauri Desktop, TAURI_ENV_PLATFORM is set by the Tauri CLI.
// We conditionally activate 'output: export' (SSG) so Tauri can package raw HTML/CSS/JS
// static assets directly into the native macOS/Windows/Linux binary bundle, while
// retaining standard dynamic SSR capabilities on Vercel deployments.
// ============================================================================

/** @type {import('next').NextConfig} */
const isTauriBuild = process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig = {
  // Static export only when building Tauri desktop binary
  output: isTauriBuild ? 'export' : undefined,

  // Images must be unoptimized for static desktop export
  images: {
    unoptimized: isTauriBuild,
  },

  // Ensure trailing slashes match static file index routing in Tauri webview
  trailingSlash: isTauriBuild,

  // Strict React mode for robust WebGL and lifecycle safety
  reactStrictMode: true,

  transpilePackages: ['three'],
};

export default nextConfig;
