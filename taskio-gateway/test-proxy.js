const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log('HOOK FIRED!');
    }
  }
}));

app.listen(3005, () => console.log('Proxy on 3005'));
