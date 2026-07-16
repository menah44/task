const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log('HOOK FIRED POST NO PARSER!');
    }
  }
}));

app.listen(3011, () => console.log('Proxy on 3011'));
