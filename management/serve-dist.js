const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
};

http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const requestedPath = path.resolve(root, `.${pathname}`);
  const relativePath = path.relative(root, requestedPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  const filePath = path.join(requestedPath, 'index.html');
  const targetPath = fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()
    ? filePath
    : requestedPath;

  fs.stat(targetPath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(targetPath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(targetPath).pipe(response);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist/ at http://127.0.0.1:${port}`);
});
