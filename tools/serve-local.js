const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.argv[2];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/stats.html';
  const file = path.join(root, reqPath.replace(/^\/+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'text/plain; charset=utf-8');
    res.end(data);
  });
}).listen(4173, '127.0.0.1');
