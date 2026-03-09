const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3002; // Proxy server port

// Enable CORS for all origins (you can restrict this to specific origins)
app.use(cors({
  origin: '*', // Allow all origins, or specify: 'http://192.168.18.169'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Parse JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ========================================
// KEYCLOAK PROXY ROUTES
// ========================================

// Keycloak token endpoint
app.post('/keycloak/realms/:realm/protocol/openid-connect/token', async (req, res) => {
  try {
    const { realm } = req.params;
    const targetUrl = `https://nvcm.geosystems-me.com/keycloak/realms/${realm}/protocol/openid-connect/token`;

    console.log('🔑 Proxying Keycloak token request to:', targetUrl);

    // Convert body to URLSearchParams
    const formBody = new URLSearchParams();
    Object.keys(req.body).forEach(key => {
      formBody.append(key, req.body[key]);
    });

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Keycloak error:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Token obtained successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error (Keycloak):', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// Keycloak token introspection endpoint
app.post('/keycloak/realms/:realm/protocol/openid-connect/token/introspect', async (req, res) => {
  try {
    const { realm } = req.params;
    const targetUrl = `https://nvcm.geosystems-me.com/keycloak/realms/${realm}/protocol/openid-connect/token/introspect`;

    console.log('🔍 Proxying Keycloak introspect request to:', targetUrl);

    const formBody = new URLSearchParams();
    Object.keys(req.body).forEach(key => {
      formBody.append(key, req.body[key]);
    });

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString()
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy error (Introspect):', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// ========================================
// APOLLO API PROXY ROUTES
// ========================================

// Generic Apollo API proxy
app.all('/apollo/api/*', async (req, res) => {
  try {
    const apiPath = req.path.replace('/apollo/api/', '');
    const targetUrl = `https://nvcm.geosystems-me.com/apollo/api/${apiPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    console.log('🌐 Proxying Apollo API request to:', targetUrl);

    // Get authorization header from request
    const headers = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const options = {
      method: req.method,
      headers: headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Apollo API error:', response.status, targetUrl);
      return res.status(response.status).json(data);
    }

    console.log('✅ Apollo API response:', response.status);
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error (Apollo API):', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// ========================================
// OGC WMS PROXY ROUTES
// ========================================

// WMS GetCapabilities, GetMap, etc.
app.get('/apollo/ogc/wms/*', async (req, res) => {
  try {
    const wmsPath = req.path.replace('/apollo/ogc/wms/', '');
    const queryString = req.url.substring(req.url.indexOf('?'));
    const targetUrl = `https://nvcm.geosystems-me.com/apollo/ogc/wms/${wmsPath}${queryString}`;

    console.log('🗺️ Proxying WMS request to:', targetUrl);

    const headers = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
    });

    // Check content type - could be XML or image
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('image')) {
      // Return image
      const buffer = await response.buffer();
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
    } else if (contentType && (contentType.includes('xml') || contentType.includes('text'))) {
      // Return XML/text
      const text = await response.text();
      res.setHeader('Content-Type', contentType);
      res.send(text);
    } else {
      // Return JSON
      const data = await response.json();
      res.json(data);
    }

    console.log('✅ WMS response:', response.status);
  } catch (error) {
    console.error('❌ Proxy error (WMS):', error.message);
    res.status(500).json({ error: 'Proxy error', message: error.message });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    proxy: 'apollo-api-proxy',
    version: '1.0.0',
    endpoints: {
      keycloak: 'https://nvcm.geosystems-me.com/keycloak',
      apollo: 'https://nvcm.geosystems-me.com/apollo/api',
      wms: 'https://nvcm.geosystems-me.com/apollo/ogc/wms'
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Apollo API Proxy Server',
    status: 'running',
    port: PORT,
    endpoints: [
      'POST /keycloak/realms/:realm/protocol/openid-connect/token',
      'POST /keycloak/realms/:realm/protocol/openid-connect/token/introspect',
      'ALL  /apollo/api/*',
      'GET  /apollo/ogc/wms/*',
      'GET  /health'
    ]
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 Apollo API Proxy Server');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Server running on: http://localhost:${PORT}`);
  console.log('');
  console.log('  📋 Available endpoints:');
  console.log('     • Keycloak:  POST /keycloak/realms/*/protocol/openid-connect/token');
  console.log('     • Apollo API: ALL /apollo/api/*');
  console.log('     • WMS:        GET /apollo/ogc/wms/*');
  console.log('     • Health:     GET /health');
  console.log('');
  console.log('  🎯 Proxying to:');
  console.log('     • https://nvcm.geosystems-me.com');
  console.log('');
  console.log('  🌐 CORS: Enabled for all origins');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});
