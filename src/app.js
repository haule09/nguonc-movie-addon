import express from "express";
import { createRequire } from "module";
import { buildManifest } from "./manifest.js";
import * as nguonc from "./providers/nguonc.js";
import { getItems, toMetaPreview, toMeta, findEpisodeStreams } from "./utils/mapper.js";

const require = createRequire(import.meta.url);
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const manifest = buildManifest();
const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
  if (type !== "movie") return { metas: [] };

  const search = String(extra.search || "").trim();
  const skip = Math.max(0, Number(extra.skip || 0));
  const page = Math.floor(skip / 10) + 1;

  const raw = search
    ? await nguonc.search(search, page)
    : id === "nguonc-movies"
      ? await nguonc.movies(page)
      : await nguonc.latest(page);

  return {
    metas: getItems(raw).map(toMetaPreview).filter(Boolean),
    cacheMaxAge: 300,
    staleRevalidate: 600,
    staleError: 86400
  };
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (type !== "movie" || !id?.startsWith("nguonc:")) return { meta: null };

  const slug = nguonc.slugFromId(id).split(":ep:")[0];
  const raw = await nguonc.detail(slug);

  return {
    meta: toMeta(raw, slug),
    cacheMaxAge: 300,
    staleRevalidate: 600,
    staleError: 86400
  };
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (type !== "movie" || !id?.startsWith("nguonc:")) return { streams: [] };

  const decodedId = decodeURIComponent(String(id));
  const withoutPrefix = decodedId.slice("nguonc:".length);
  const separator = withoutPrefix.indexOf(":ep:");
  const slug = separator >= 0 ? withoutPrefix.slice(0, separator) : withoutPrefix;
  const episode = separator >= 0 ? withoutPrefix.slice(separator + 4) : null;

  const raw = await nguonc.detail(slug);
  return {
    streams: findEpisodeStreams(raw, episode),
    cacheMaxAge: 60,
    staleRevalidate: 120,
    staleError: 600
  };
});

const app = express();
app.disable("x-powered-by");
app.disable("etag");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Origin");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/manifest.json", (req, res) => {
  res.json(buildManifest(req));
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "nguonc-stremio-addon", version: "1.0.1" });
});

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8"><title>NguonC Movie Add-on</title></head><body style="font-family:Arial;padding:30px"><h1>NguonC Movie Add-on</h1><p><a href="/manifest.json">Manifest</a></p><p><a href="/health">Health</a></p></body></html>`);
});

const addonInterface = builder.getInterface();
app.use("/", getRouter(addonInterface));

export default app;
