import { config } from "./config.js";

export function buildManifest() {
  return {
    id: "com.nguonc.movieaddon",
    version: "1.0.0",
    name: "NguonC Movie Add-on",
    description: "Movies and series catalog, metadata and streams powered by NguonC.",
    logo: `${config.baseUrl}/logo.png`,
    background: undefined,
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    catalogs: [
      {
        type: "movie",
        id: "nguonc-latest",
        name: "NguonC - Phim mới",
        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }]
      },
      {
        type: "movie",
        id: "nguonc-movies",
        name: "NguonC - Phim lẻ",
        extra: [{ name: "search", isRequired: false }, { name: "skip", isRequired: false }]
      }
    ],
    idPrefixes: ["nguonc:"],
    contactEmail: config.contactEmail,
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  };
}
