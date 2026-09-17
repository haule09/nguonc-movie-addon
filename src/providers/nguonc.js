import { API, config } from "../config.js";
import { getCache, setCache } from "../utils/cache.js";
import { getJson } from "../utils/http.js";

async function cached(key, loader) {
  const hit = getCache(key);
  if (hit !== null) return hit;
  return setCache(key, await loader(), config.cacheTtlMs);
}

export function idForSlug(slug) {
  return `nguonc:${slug}`;
}

export function slugFromId(id) {
  const value = decodeURIComponent(String(id || ""));
  return value.startsWith("nguonc:") ? value.slice("nguonc:".length) : value;
}

export async function latest(page = 1) {
  return cached(`latest:${page}`, () => getJson(`${API.latest}${page}`));
}

export async function movies(page = 1) {
  return cached(`movies:${page}`, () => getJson(`${API.movies}${page}`));
}

export async function search(keyword, page = 1) {
  const base = `${API.search}${encodeURIComponent(keyword)}`;
  const url = page > 1 ? `${base}&page=${page}` : base;
  return cached(`search:${keyword}:${page}`, () => getJson(url));
}

export async function detail(slug) {
  return cached(`detail:${slug}`, () => getJson(`${API.detail}${encodeURIComponent(slug)}`));
}
