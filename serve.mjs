import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const LOCALE = process.env.LOCALE || 'be';
const ROOT = new URL(`./dist/${LOCALE}/`, import.meta.url).pathname;
const PORT = process.env.PORT || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let path = normalize(join(ROOT, url));
  if (!path.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    if (statSync(path).isDirectory()) path = join(path, 'index.html');
    const data = readFileSync(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
}).listen(PORT, () => console.log(`Preview [${LOCALE}] at http://localhost:${PORT}`));
