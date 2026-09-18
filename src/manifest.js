import { getBaseUrl } from "./config.js";

export function buildManifest(req) {
  const baseUrl = getBaseUrl(req);

  return {
    id: "com.nguonc.movieaddon",
    version: "1.0.1",
    name: "NguonC Movie Add-on",
    description: "Movies catalog, metadata and streams powered by NguonC.",
    logo: `${baseUrl}/logo.svg`,
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs: [
      {
        type: "movie",
        id: "nguonc-latest",
        name: "NguonC - Phim mới",
        extra: [
          { name: "search", isRequired: false },
          { name: "skip", isRequired: false }
        ]
      },
      {
        type: "movie",
        id: "nguonc-movies",
        name: "NguonC - Phim lẻ",
        extra: [
          { name: "search", isRequired: false },
          { name: "skip", isRequired: false }
        ]
      }
    ],
    idPrefixes: ["nguonc:"],
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  };
}
