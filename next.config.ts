import type { NextConfig } from "next"

// The Socket.io server runs on a separate port — a different origin from the
// Next.js app. CSP connect-src must explicitly allow it.
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3002"
// WebSocket variant of the same URL (wss:// for https://, ws:// for http://)
const socketWsUrl = socketUrl.replace(/^http/, "ws")

// unsafe-eval is only needed for Next.js HMR in development.
// Production builds do not require it, so we omit it in prod.
const scriptSrc = [
  "'self'",
  "'unsafe-inline'", // required for Next.js App Router inline scripts/hydration
  process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
]
  .filter(Boolean)
  .join(" ")

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src ${scriptSrc}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              // Allow connections to the Socket.io server (HTTP polling + WebSocket upgrade)
              `connect-src 'self' ${socketUrl} ${socketWsUrl}`,
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
