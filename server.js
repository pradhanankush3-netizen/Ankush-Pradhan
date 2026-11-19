const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname);
const INITIAL_PORT = parseInt(process.env.PORT, 10) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip'
};

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(ROOT, pathname));

  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheControl = ext === '.html'
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=86400';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*'
    };

    if (ext === '.zip') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(safePath)}"`;
    }

    res.writeHead(200, headers);

    fs.createReadStream(safePath).pipe(res);
  });
});

let currentPort = INITIAL_PORT;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    currentPort += 1;
    server.listen(currentPort, '0.0.0.0');
  } else {
    console.error('Server error:', err);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Server running at http://localhost:${address.port}/`);
});

server.listen(currentPort, '0.0.0.0');
