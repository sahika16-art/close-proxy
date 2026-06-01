const http = require('http');
const https = require('https');

const CLOSE_API_KEY = 'api_0KHhoYYra8IYfgF4sag2sP.3E6Z9mjuRQgnk83uCIyqQ9';
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!req.url.startsWith('/api/')) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'ok', message: 'Close proxy running'}));
    return;
  }

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
        'Accept': 'application/json',
      }
    };

    const proxy = https.request(options, closeRes => {
      res.writeHead(closeRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      closeRes.pipe(res);
    });

    proxy.on('error', err => {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: err.message}));
    });

    if (body) proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log('Close proxy running on port', PORT));
