const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', (req, res, next) => {
  req.headers['x-user-id'] = 123;
  next();
}, createProxyMiddleware({
  target: 'http://localhost:3013',
  changeOrigin: true
}));

app.listen(3012, () => console.log('Proxy on 3012'));

const http = require('http');
http.createServer((req, res) => {
  console.log('Backend received headers:', req.headers);
  res.end('OK');
}).listen(3013, () => console.log('Backend on 3013'));
