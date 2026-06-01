const http = require('http');
const https = require('https');

const CLOSE_API_KEY = 'api_0KHhoYYra8IYfgF4sag2sP.3E6Z9mjuRQgnk83uCIyqQ9';
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS headers — allow any origin so GitHub Pages can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only proxy /api/* paths
  if (!req.url.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Strip /api prefix and forward to Close
  const closePath = req.url.replace(/^\/api/, '');
  const auth = 'Basic ' + Buffer.from(CLOSE_API_KEY + ':').toString('base64');

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.close.com',
      path: '/api/v1' + closePath,
      method: req.method,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      }
    };

    const proxy = https.request(options, closeRes => {
      res.writeHead(closeRes.statusCode, { 'Content-Type': 'application/json' });
      closeRes.pipe(res);
    });

    proxy.on('error', err => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });

    if (body) proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, () => console.log('Close proxy running on port', PORT));
