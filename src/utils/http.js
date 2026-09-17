import { config } from "../config.js";

export async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "NguonC-Stremio-Addon/1.0"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Upstream HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data?.status && data.status !== "success") {
      throw new Error(data.message || "NguonC API returned an error");
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}
