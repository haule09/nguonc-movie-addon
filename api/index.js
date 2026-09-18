const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// URL API gốc
const API_BASE_V1 = 'https://phimapi.com/v1/api';
// const API_BASE_V1 = 'https://phimapi.com';

// Số lượng item trên 1 trang của PhimAPI (mặc định là 10 hoặc 24 tùy danh sách, trung bình tính khoảng 10-24 item/trang)
const ITEMS_PER_PAGE = 24;

// Manifest Addon cho Stremio
const manifest = {
    id: 'com.phimapi.stremio.addon',
    version: '1.1.0',
    name: 'PhimAPI Stremio',
    description: 'Xem phim từ PhimAPI.com trên Stremio',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    idPrefixes: ['phimapi_'],
    catalogs: [
        {
            type: 'movie',
            id: 'phimapi-latest',
            name: 'Mới Cập Nhật',
            extra: [
                { name: 'search', isRequired: false },
                { name: 'skip', isRequired: false } // Kích hoạt tính năng cuộn trang tự động trong Stremio
            ]
        },
        {
            type: 'movie',
            id: 'phimapi-phimle',
            name: 'Phim Lẻ',
            extra: [
                { name: 'search', isRequired: false },
                { name: 'skip', isRequired: false } // Kích hoạt tính năng cuộn trang tự động trong Stremio
            ]
        }
    ]
};

// Hàm chuyển đổi dữ liệu từ PhimAPI sang chuẩn Stremio Meta Preview
function mapToMetaPreview(item, pathImage) {
    const slug = item.slug || '';
    let poster = item.poster_url || item.thumb_url || '';

    // Xử lý domain ảnh nếu API trả về đường dẫn tương đối (pathImage)
    if (poster && !poster.startsWith('http')) {
        const baseImg = pathImage ? pathImage.replace(/\/$/, '') : 'https://phimimg.com';
        poster = `${baseImg}/${poster.replace(/^\//, '')}`;
    }

    return {
        id: `phimapi_${slug}`,
        type: item.type === 'single' ? 'movie' : 'series',
        name: item.name || item.title || '',
        poster: poster,
        description: item.origin_name ? `Tên gốc: ${item.origin_name}` : ''
    };
}

// 1. Manifest Endpoints
app.get('/', (req, res) => res.json(manifest));
app.get('/manifest.json', (req, res) => res.json(manifest));

// 2. Catalog Endpoint (Danh sách phim, Tìm kiếm & Phân trang)
app.get('/catalog/:type/:id/:extra?.json', async (req, res) => {
    const { id, extra } = req.params;

    let searchQuery = null;
    let skip = 0;

    if (extra) {
        const params = new URLSearchParams(extra);
        searchQuery = params.get('search');
        skip = parseInt(params.get('skip') || '0', 10);
    }

    // Tính số trang dựa vào tham số skip của Stremio (Ví dụ: skip=0 -> page 1, skip=24 -> page 2, ...)
    const page = Math.floor(skip / ITEMS_PER_PAGE) + 1;

    try {
        let url = '';

        if (searchQuery) {
            // Tìm kiếm (có hỗ trợ page)
            url = `${API_BASE_V1}/tim-kiem?keyword=${encodeURIComponent(searchQuery)}&limit=100&page=${page}`;
        } else if (id === 'phimapi-latest') {
            // Phim mới cập nhật với query ?page=
            url = `${API_BASE_V1}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        } else if (id === 'phimapi-phimle') {
            // Phim lẻ mới nhất với query ?page=
            url = `${API_BASE_V1}/danh-sach/phim-le?sort_field=year&page=${page}`;
        } else {
            return res.json({ metas: [] });
        }

        const response = await axios.get(url, { timeout: 8000 });
        const resData = response.data;

        let items = [];
        let pathImage = '';

        if (resData?.data?.items) {
            // API V1 (tìm kiếm, phim lẻ)
            items = resData.data.items;
            pathImage = resData.data.APP_DOMAIN_CDN_IMAGE || 'https://phimimg.com';
        } else if (resData?.items) {
            // API Root (phim mới cập nhật)
            items = resData.items;
            pathImage = resData.pathImage || 'https://phimimg.com';
        }

        const metas = items.map(item => mapToMetaPreview(item, pathImage));
        return res.json({ metas });
    } catch (error) {
        console.error(`Catalog Error (Page ${page}):`, error.message);
        return res.json({ metas: [] });
    }
});

// 3. Meta Endpoint (Chi tiết phim)
app.get('/meta/:type/:id.json', async (req, res) => {
    const { id } = req.params;
    const slug = id.replace('phimapi_', '');

    try {
        const response = await axios.get(`${API_BASE_V1}/phim/${slug}`, { timeout: 8000 });
        const movieData = response.data?.movie;

        if (!movieData) return res.json({ meta: {} });

        const poster = movieData.poster_url || movieData.thumb_url;

        const meta = {
            id: id,
            type: movieData.type === 'single' ? 'movie' : 'series',
            name: movieData.name,
            poster: poster,
            background: movieData.thumb_url || poster,
            description: movieData.content ? movieData.content.replace(/<[^>]*>?/gm, '') : '',
            genres: movieData.category ? movieData.category.map(c => c.name) : [],
            year: movieData.year || ''
        };

        return res.json({ meta });
    } catch (error) {
        console.error('Meta Error:', error.message);
        return res.json({ meta: {} });
    }
});

// 4. Stream Endpoint (Lấy link phát phim)
app.get('/stream/:type/:id.json', async (req, res) => {
    const { id } = req.params;
    const slug = id.replace('phimapi_', '');

    try {
        const response = await axios.get(`${API_BASE_V1}/phim/${slug}`, { timeout: 8000 });
        const episodesData = response.data?.episodes || [];

        const streams = [];

        episodesData.forEach(server => {
            const serverName = server.server_name || 'PhimAPI Server';
            const serverData = server.server_data || [];

            serverData.forEach(ep => {
                if (ep.link_m3u8) {
                    streams.push({
                        title: `${serverName} - Tập ${ep.name}`,
                        url: ep.link_m3u8
                    });
                } else if (ep.link_embed) {
                    streams.push({
                        title: `${serverName} - Tập ${ep.name} (Web)`,
                        externalUrl: ep.link_embed
                    });
                }
            });
        });

        return res.json({ streams });
    } catch (error) {
        console.error('Stream Error:', error.message);
        return res.json({ streams: [] });
    }
});

// Chạy Local Server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 7000;
    app.listen(PORT, () => console.log(`Server chạy tại: http://localhost:${PORT}/manifest.json`));
}

module.exports = app;