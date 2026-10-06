import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {parseArgs} from 'node:util';

// Dependency-free local preview. Vercel continues to serve dist directly.
const {values} = parseArgs({options: {host: {type: 'string', default: '127.0.0.1'}, port: {type: 'string', default: '4173'}, strictPort: {type: 'boolean', default: true}}});
const root = resolve('dist');
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml'};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const path = resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const content = await readFile(path);
    response.writeHead(200, {'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store'}).end(content);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(Number(values.port), values.host, () => console.log(`Local preview listening on port ${values.port}`));
