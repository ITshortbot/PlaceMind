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
    // Path-based dev proxies (code-server /proxy/PORT) must also prefix the image optimizer
    path: process.env.NEXT_ASSET_PREFIX ? process.env.NEXT_ASSET_PREFIX + "/_next/image" : undefined,
  },

  // Ensure trailing slashes match static file index routing in Tauri webview
  trailingSlash: isTauriBuild,

  // Strict React mode for robust WebGL and lifecycle safety
  reactStrictMode: true,

  // Path-based dev proxies (e.g. code-server /proxy/PORT) serve the app under
  // a subpath; without this the absolute /_next asset URLs bypass the proxy.
  // Unset in normal local dev and Vercel - no behavior change.
  assetPrefix: process.env.NEXT_ASSET_PREFIX || undefined,

  // Full path-prefix deployments (code-server /absproxy/PORT dev tunnel, whose
  // proxy passes the path through instead of stripping it): serve pages,
  // _next assets and public files under the prefix. next/link, useRouter and
  // next/image all prepend basePath automatically. API calls use the same
  // prefix through NEXT_PUBLIC_BASE_PATH.
  // Unset in normal local dev and Vercel - no behavior change.
  basePath: process.env.NEXT_BASE_PATH || undefined,

  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_BASE_PATH || '',
  },

  transpilePackages: ['three'],
};

export default nextConfig;
