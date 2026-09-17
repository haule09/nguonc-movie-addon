# NguonC Movie Add-on Server - Vercel Ready

Stremio-compatible add-on server backed by the NguonC APIs.

## APIs

- `https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=`
- `https://phim.nguonc.com/api/films/danh-sach/phim-le?sort_field=update&page=`
- `https://phim.nguonc.com/api/film/`
- `https://phim.nguonc.com/api/films/search?keyword=`

## Local setup

Requirements: Node.js 22+.

```bash
npm install
npm start
```

Open:

- http://localhost:7000/manifest.json
- http://localhost:7000/health

## Vercel setup

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Framework Preset: `Other`.
4. No build command is required.
5. Install command: `npm install`.
6. Node.js runtime: `22.x`.
7. Deploy.

After deployment, test:

```text
https://YOUR-PROJECT.vercel.app/health
https://YOUR-PROJECT.vercel.app/manifest.json
```

Then install the manifest URL in a compatible Stremio client.

## Environment variables

No environment variable is required for the basic Vercel deployment. Optional values:

- `CACHE_TTL_SECONDS`
- `REQUEST_TIMEOUT_MS`
- `CONTACT_EMAIL`
- `ADDON_BASE_URL` (mainly useful for local/custom-domain deployments)

`PORT` is only used by the local Express server; Vercel manages the serverless runtime port.

## Important

The stream handler currently returns the `embed`/`link`/`url` exposed by the upstream NguonC API. An iframe/player URL is not automatically a direct HLS/MP4 stream.
