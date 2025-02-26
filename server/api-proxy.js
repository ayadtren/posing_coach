/**
 * API Proxy Server for LLM requests
 * This server handles CORS issues by proxying requests to external LLM APIs
 */

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3334;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json({limit: '50mb'}));  // Increased size limit for image data

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API proxy server is running' });
});

// Proxy endpoint for the primary LLM API
app.use('/api/llm/primary', createProxyMiddleware({
  target: 'https://free-llm-api.onrender.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/llm/primary': '/api/generate'
  },
  onProxyRes: function(proxyRes, req, res) {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Proxy endpoint for the fallback LLM API
app.use('/api/llm/fallback', createProxyMiddleware({
  target: 'https://huggingface-text-generation.onrender.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/llm/fallback': '/api/generate'
  },
  onProxyRes: function(proxyRes, req, res) {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
}));

// Proxy endpoint for DensePose service
app.use('/api/densepose', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api/densepose': '/'
  },
  onProxyRes: function(proxyRes, req, res) {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  },
  onError: (err, req, res) => {
    console.error('DensePose proxy error:', err);
    res.status(500).json({ error: 'DensePose proxy error', message: err.message });
  }
}));

// Fallback endpoint that returns a mock response
app.post('/api/llm/mock', (req, res) => {
  const { prompt } = req.body;
  
  // Generate a simple response based on the prompt
  let response = "I'm analyzing your pose. ";
  
  if (prompt.includes('front double biceps')) {
    response += "For your front double biceps, focus on raising your elbows higher to maximize bicep peak. Contract your abs harder and spread your lats wider for a more impressive V-taper.";
  } else if (prompt.includes('side chest')) {
    response += "In your side chest pose, push your chest out more forcefully and twist your torso further. Flex your forward leg harder to showcase quad separation.";
  } else if (prompt.includes('back')) {
    response += "For your back pose, pull your shoulder blades together more aggressively to create deeper detail. Lower your hands slightly to improve lat spread visibility.";
  } else {
    response += "Focus on maintaining tension throughout all muscle groups. Remember to breathe and hold the pose with confidence.";
  }
  
  res.json({ text: response });
});

// DensePose status check endpoint
app.get('/api/densepose/status', (req, res) => {
  const axios = require('axios');
  
  axios.get('http://localhost:5000/health')
    .then(response => {
      res.json({ status: 'ok', message: 'DensePose service is running' });
    })
    .catch(error => {
      res.status(503).json({ 
        status: 'error', 
        message: 'DensePose service is not available',
        details: error.message
      });
    });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API proxy server running on port ${PORT}`);
});

// Export for potential serverless deployment
module.exports = app; 