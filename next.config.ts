import type { NextConfig } from "next";

/**
 * Le backend n'est plus dans Next.js : toutes les routes /api/* sont relayées vers la
 * Cloud Function `api` (Firebase). Le navigateur reste en same-origin (cookie __session,
 * aucun CORS nécessaire).
 *
 * KAWERU_API_ORIGIN : URL de la fonction, ex. https://europe-west1-kaweru-app.cloudfunctions.net/api
 * (en local avec l'émulateur : http://127.0.0.1:5001/kaweru-app/europe-west1/api).
 * Si le site est servi par Firebase Hosting, la réécriture Hosting /api/** prend le relais.
 */
const API_ORIGIN = (
  process.env.KAWERU_API_ORIGIN || "https://europe-west1-kaweru-app.cloudfunctions.net/api"
).replace(/\/$/, "");
const WEBHOOK_URL =
  process.env.KAWERU_FEDAPAY_WEBHOOK_URL || "https://europe-west1-kaweru-app.cloudfunctions.net/fedapayWebhook";

const nextConfig: NextConfig = {
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      // Ancienne URL du webhook FedaPay (configurée sur le tableau de bord) → fonction dédiée.
      { source: "/api/webhooks/fedapay", destination: WEBHOOK_URL },
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
