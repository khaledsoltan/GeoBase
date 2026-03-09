# 🚀 Quick Start Guide

## 📋 What This Does

This proxy server solves the **CORS error** by forwarding requests from your browser to the Apollo API and Keycloak servers.

```
Your Browser → Proxy Server (localhost:3002) → Real Servers (nvcm.geosystems-me.com)
                ✅ No CORS error!
```

---

## 🎯 Steps to Run

### 1. Open Terminal in This Folder

```bash
cd D:\GeoAssistant\apollo-proxy
```

### 2. Install Dependencies (First Time Only)

```bash
npm install
```

This will install:
- express
- cors
- node-fetch
- body-parser

### 3. Start the Proxy Server

```bash
npm start
```

You should see:

```
═══════════════════════════════════════════════════════════
  🚀 Apollo API Proxy Server
═══════════════════════════════════════════════════════════
  ✅ Server running on: http://localhost:3002

  📋 Available endpoints:
     • Keycloak:  POST /keycloak/realms/*/protocol/openid-connect/token
     • Apollo API: ALL /apollo/api/*
     • WMS:        GET /apollo/ogc/wms/*
     • Health:     GET /health

  🎯 Proxying to:
     • https://nvcm.geosystems-me.com

  🌐 CORS: Enabled for all origins
═══════════════════════════════════════════════════════════
```

### 4. Test the Proxy

Open browser and go to:
```
http://localhost:3002/health
```

You should see:
```json
{
  "status": "healthy",
  "proxy": "apollo-api-proxy",
  "version": "1.0.0"
}
```

### 5. Now Use Your Application

Your catex extension is already configured to use the proxy!

Just refresh your application at `http://192.168.18.169` and the catalog browser will work without CORS errors.

---

## ✅ Verification

When you click "Browse Catalog" in the geoprocessing panel, you should see in the proxy console:

```
📥 POST /keycloak/realms/ApolloSrv/protocol/openid-connect/token
🔑 Proxying Keycloak token request to: https://nvcm.geosystems-me.com/...
✅ Token obtained successfully

📥 GET /apollo/api/folder/detailed
🌐 Proxying Apollo API request to: https://nvcm.geosystems-me.com/...
✅ Apollo API response: 200
```

---

## 🛑 To Stop the Proxy

Press `Ctrl + C` in the terminal

---

## 🔄 Development Mode (Auto-Restart)

For development with automatic restart on file changes:

```bash
npm run dev
```

---

## ❌ Common Issues

### Issue: "npm: command not found"

**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Port 3002 already in use"

**Solution:** Either:
1. Kill the process using port 3002
2. Or change the port in `server.js` (line 5)

### Issue: "Cannot find module 'express'"

**Solution:** Run `npm install` again

---

## 📝 What's Configured

Your application config (`core/lib/config/keycloak.json`) now points to:

```json
{
  "url": "http://localhost:3002/keycloak/realms/ApolloSrv/protocol/openid-connect/token",
  "apiBaseUrl": "http://localhost:3002/apollo/api"
}
```

This means ALL API requests go through the proxy server at `localhost:3002`, which then forwards them to the real server with proper CORS headers.

---

## 🎉 That's It!

1. ✅ Proxy server running on `localhost:3002`
2. ✅ Catalog browser configured to use proxy
3. ✅ CORS issue solved!

**Now test:** Open your app, click "Browse Catalog", and it should work!
