// Локальная эмуляция GitHub Pages: dist/ по адресу /BAR/, неизвестный путь → 404.html со статусом 404.
// node scripts/serve-gh-pages.mjs [порт=4174]  (после npm run build:gh-pages)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const BASE = '/BAR/';
const port = Number(process.argv[2] ?? 4174);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(BASE)) return res.writeHead(404).end('not under /BAR/');
  let file = normalize(join('dist', path.slice(BASE.length)));
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] }).end(await readFile('dist/404.html'));
  }
}).listen(port, '127.0.0.1', () => console.log(`GitHub Pages (эмуляция): http://127.0.0.1:${port}${BASE}`));
