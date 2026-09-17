import express from "express";
import { createRequire } from "module";
import { config } from "./config.js";
import { buildManifest } from "./manifest.js";
import * as nguonc from "./providers/nguonc.js";
import { getItems, toMetaPreview, toMeta, findEpisodeStreams, getMovieObject } from "./utils/mapper.js";

const require = createRequire(import.meta.url);
const { addonBuilder, getRouter } = require("stremio-addon-sdk");

const manifest = buildManifest();
const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
  if (type !== "movie") return { metas: [] };

  const search = String(extra.search || "").trim();
  const skip = Number(extra.skip || 0);
  const page = Math.floor(skip / 10) + 1;

  const raw = search
    ? await nguonc.search(search, page)
    : id === "nguonc-movies"
      ? await nguonc.movies(page)
      : await nguonc.latest(page);

  const metas = getItems(raw).map(toMetaPreview).filter(Boolean);
  return {
    metas,
    cacheMaxAge: 300,
    staleRevalidate: 600,
    staleError: 86400
  };
});

builder.defineMetaHandler(async ({ type, id }) => {
  if (!id?.startsWith("nguonc:")) return { meta: null };
  const slug = nguonc.slugFromId(id);
  const raw = await nguonc.detail(slug);
  return {
    meta: toMeta(raw, slug),
    cacheMaxAge: 300,
    staleRevalidate: 600,
    staleError: 86400
  };
});

builder.defineStreamHandler(async ({ type, id }) => {
  if (!id?.startsWith("nguonc:")) return { streams: [] };

  const slug = nguonc.slugFromId(id).split(":ep:")[0];
  const episode = id.includes(":ep:") ? id.split(":ep:")[1] : null;
  const raw = await nguonc.detail(slug);
  const streams = findEpisodeStreams(raw, episode);

  return {
    streams,
    cacheMaxAge: 60,
    staleRevalidate: 120,
    staleError: 600
  };
});

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/manifest.json", (_req, res) => res.json(manifest));
app.get("/health", (_req, res) => res.json({ ok: true, service: "nguonc-stremio-addon" }));
app.get("/", (_req, res) => res.type("html").send(`<!doctype html><html><body style="font-family:Arial;padding:30px"><h1>NguonC Movie Add-on</h1><p>Stremio manifest: <a href="/manifest.json">/manifest.json</a></p><p>Health: <a href="/health">/health</a></p></body></html>`));

const addonInterface = builder.getInterface();
app.use("/", getRouter(addonInterface));

export default app;
