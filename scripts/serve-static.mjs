import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4311);
const mime = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.svg':'image/svg+xml'};
const server = http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {response.writeHead(405); return response.end();}
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname).replace(/^\/evaltra-website(?=\/)/, '');
    const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {response.writeHead(403); return response.end();}
    const bytes = await readFile(file);
    response.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {response.writeHead(404); response.end('Not found');}
});
server.listen(port, '127.0.0.1', () => console.log(`Static preview: http://127.0.0.1:${port}/evaltra-website/`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close());
