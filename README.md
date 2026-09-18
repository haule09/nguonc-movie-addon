# NguonC Movie Add-on Server — Vercel Ready v3

A Stremio-compatible add-on server backed by the NguonC APIs.

## Included APIs

- Latest: `https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=`
- Movies: `https://phim.nguonc.com/api/films/danh-sach/phim-le?sort_field=update&page=`
- Detail: `https://phim.nguonc.com/api/film/{slug}`
- Search: `https://phim.nguonc.com/api/films/search?keyword=`

## Vercel deploy

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Framework Preset: `Other`.
4. Build Command: leave empty.
5. Output Directory: leave empty.
6. Node.js: 22.x (already pinned in `package.json`).
7. Deploy.

No `PORT` or `app.listen()` is required on Vercel.

## Verify

After deployment, open:

- `/health`
- `/manifest.json`
- `/catalog/movie/nguonc-latest.json`
- `/catalog/movie/nguonc-movies.json`
- `/catalog/movie/nguonc-latest/search=Regeneration.json`

Then install `/manifest.json` in the client.

## Local development

```bash
npm install
npm start
```

Open `http://localhost:7000/manifest.json`.

## Notes

- The manifest advertises `movie` only in v3 because the current catalogs/API mapping are implemented for movies. Series can be added after dedicated series catalog/episode handling is verified.
- The logo is served from `/public/logo.svg`; the manifest URL is generated from the incoming public host so it does not point to localhost on Vercel.
- Stream URLs are passed through from NguonC. An `embed` URL is not automatically converted into a direct HLS/MP4 URL.
