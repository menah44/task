const http = require('http');
const server = http.createServer((req, res) => {
  res.end('OK');
});
server.listen(3008, () => {
  const req = http.request({
    port: 3008,
    headers: { 'x-user-id': 1 }
  }, (res) => {
    console.log('Response status:', res.statusCode);
    process.exit(0);
  });
  req.on('error', (err) => {
    console.error('Request error:', err);
    process.exit(1);
  });
  req.end();
});
