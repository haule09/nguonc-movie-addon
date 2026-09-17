export function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function getMovieObject(raw) {
  return raw?.movie || raw?.data || raw || {};
}

export function getItems(raw) {
  return Array.isArray(raw?.items) ? raw.items : [];
}

export function getImage(item) {
  return item?.poster_url || item?.thumb_url || undefined;
}

export function detectType(item) {
  const explicit = String(item?.type || item?.content_type || "").toLowerCase();
  if (["series", "tv"].includes(explicit)) return "series";
  if (["movie", "film"].includes(explicit)) return "movie";
  if (item?.is_series === true || item?.isSeries === true) return "series";
  const categories = Array.isArray(item?.categories) ? item.categories : [];
  if (categories.some(c => /series|tv/i.test(String(c?.name || c)))) return "series";
  return "movie";
}

export function toMetaPreview(item) {
  const slug = item?.slug;
  if (!slug) return null;
  return {
    id: `nguonc:${slug}`,
    type: detectType(item),
    name: item?.name || item?.original_name || "Không có tên",
    poster: getImage(item),
    posterShape: "poster",
    year: Number(item?.year) || undefined,
    description: stripHtml(item?.description || "") || undefined
  };
}

export function toMeta(raw, slug) {
  const movie = getMovieObject(raw);
  const type = detectType(movie);
  const episodes = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const videos = [];

  if (type === "series") {
    for (const server of episodes) {
      for (const ep of Array.isArray(server?.items) ? server.items : []) {
        const name = String(ep?.name || "").trim();
        const number = Number.parseInt(name.match(/\d+/)?.[0] || "", 10);
        if (Number.isFinite(number)) {
          videos.push({
            id: `nguonc:${slug}:ep:${number}`,
            title: `Tập ${name}`,
            season: 1,
            episode: number,
            released: movie?.modified || movie?.created || undefined
          });
        }
      }
      if (videos.length) break;
    }
  }

  return {
    id: `nguonc:${slug}`,
    type,
    name: movie?.name || movie?.original_name || "Không có tên",
    poster: getImage(movie),
    posterShape: "poster",
    background: movie?.poster_url || movie?.thumb_url || undefined,
    logo: undefined,
    description: stripHtml(movie?.description || "") || undefined,
    year: Number(movie?.year) || undefined,
    runtime: movie?.time || undefined,
    language: movie?.language || movie?.lang || undefined,
    director: movie?.director || undefined,
    cast: movie?.casts ? String(movie.casts).split(/,\s*/) : undefined,
    genres: Array.isArray(movie?.categories)
      ? movie.categories.map(c => String(c?.name || c)).filter(Boolean)
      : undefined,
    videos: videos.length ? videos : undefined,
    behaviorHints: {
      defaultVideoId: videos[0]?.id
    }
  };
}

export function findEpisodeStreams(raw, requestedEpisode = null) {
  const movie = getMovieObject(raw);
  const servers = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const streams = [];
  const wanted = requestedEpisode ? String(requestedEpisode) : null;

  for (const server of servers) {
    const items = Array.isArray(server?.items) ? server.items : [];
    for (const ep of items) {
      const name = String(ep?.name || "").trim();
      if (wanted && !name.includes(wanted)) continue;
      const url = ep?.embed || ep?.link || ep?.url;
      if (!url) continue;
      streams.push({
        name: server?.server_name || "NguonC",
        title: name ? `Tập ${name}` : "Xem phim",
        url,
        behaviorHints: {
          notWebReady: true
        }
      });
    }
  }

  return streams;
}
