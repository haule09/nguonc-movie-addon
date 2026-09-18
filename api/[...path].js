import app from "../src/app.js";

export default function handler(req, res) {
  // Vercel rewrites /catalog/... -> /api/catalog/... .
  // Express routes are defined without the /api prefix, so strip it first.
  if (typeof req.url === "string" && req.url.startsWith("/api")) {
    req.url = req.url.slice(4) || "/";
  }

  return app(req, res);
}
