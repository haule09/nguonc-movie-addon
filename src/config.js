export const config = {
  port: Number(process.env.PORT || 7000),
  cacheTtlMs: Number(process.env.CACHE_TTL_SECONDS || 300) * 1000,
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 10000),
  contactEmail: process.env.CONTACT_EMAIL || "admin@example.com"
};

export const API = {
  latest: "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=",
  movies: "https://phim.nguonc.com/api/films/danh-sach/phim-le?sort_field=update&page=",
  detail: "https://phim.nguonc.com/api/film/",
  search: "https://phim.nguonc.com/api/films/search?keyword="
};

export function getBaseUrl(req) {
  if (process.env.ADDON_BASE_URL) {
    return process.env.ADDON_BASE_URL.replace(/\/$/, "");
  }

  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  const proto = req?.headers?.["x-forwarded-proto"] || "https";
  if (host) return `${proto}://${host}`;

  return `http://localhost:${config.port}`;
}
