const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.use('/api2', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log('HOOK FIRED ON ROOT!');
  }
}));

app.listen(3006, () => console.log('Proxy on 3006'));
