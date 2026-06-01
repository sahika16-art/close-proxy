const http = require('http');
const https = require('https');

const CLOSE_API_KEY = 'api_0KHhoYYra8IYfgF4sag2sP.3E6Z9mjuRQgnk83uCIyqQ9';
const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'ok'}));
    return;
  }

  const auth = 'Basic ' + Buffer.from(CLOSE_API_KEY + ':').toString('base64');
  
  // Collect body first, then proxy
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    
    const options = {
      hostname: 'api.close.com',
      path: req.url,
      method: req.method,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Host': 'api.close.com',
        'Content-Length': body.length,
      }
    };

    console.log(`-> ${req.method} ${req.url} body=${body.length}bytes`);

    const proxy = https.request(options, closeRes => {
      console.log(`<- ${closeRes.statusCode}`);
      res.writeHead(closeRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      closeRes.pipe(res);
    });

    proxy.on('error', err => {
      console.error('Error:', err.message);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: err.message}));
    });

    if (body.length > 0) proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Proxy running on port ${PORT}`));
