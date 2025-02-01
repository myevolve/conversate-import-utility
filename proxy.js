const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

// Create proxy middleware
const proxy = createProxyMiddleware({
  target: 'https://app.conversate.us',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '',
  },
  onProxyRes: function (proxyRes, req, res) {
    // Forward auth headers
    const authHeaders = [
      'access-token',
      'client',
      'uid',
      'expiry',
      'token-type'
    ];

    authHeaders.forEach(header => {
      const value = proxyRes.headers[header];
      if (value) {
        res.setHeader(header, value);
      }
    });
  },
});

// Use proxy for /api routes
app.use('/api', proxy);

// Start server
const port = 52224;
app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});