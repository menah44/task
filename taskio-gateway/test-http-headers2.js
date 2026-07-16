const http = require('http');
const server = http.createServer((req, res) => {
  console.log('Received headers:', req.headers);
  res.end('OK');
});
server.listen(3009, () => {
  const req = http.request({
    port: 3009,
    headers: { 'x-user-id': 1 }
  }, (res) => {
    process.exit(0);
  });
  req.on('error', (err) => {
    console.error('Request error:', err);
    process.exit(1);
  });
  req.end();
});
