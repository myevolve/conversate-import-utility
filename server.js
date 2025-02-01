const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['access-token', 'client', 'uid', 'expiry', 'token-type'],
  credentials: true,
}));

// Proxy middleware configuration
const proxyOptions = {
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
};

// Create the proxy middleware
const apiProxy = createProxyMiddleware(proxyOptions);

// Use the proxy middleware
app.use('/api', apiProxy);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${port}`);
});