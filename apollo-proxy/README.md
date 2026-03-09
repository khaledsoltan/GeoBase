# Apollo API Proxy Server

A Node.js proxy server to handle CORS issues when accessing Apollo API and Keycloak from browser applications.

## 🎯 Purpose

This proxy server forwards requests from your frontend application to:
- **Keycloak** authentication server
- **Apollo API** endpoints
- **WMS** (Web Map Service) endpoints

It adds proper CORS headers to allow browser access.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apollo-proxy
npm install
```

### 2. Start the Proxy Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The proxy will start on **http://localhost:3001**

---

## 📋 Available Endpoints

### Keycloak Authentication

```bash
POST http://localhost:3001/keycloak/realms/ApolloSrv/protocol/openid-connect/token

Body (x-www-form-urlencoded):
- grant_type: client_credentials
- client_id: apollo-api
- client_secret: 55PHxvAFM9s09sqAjjcPza8Umhtm6nLa
- scope: openid profile email
```

### Apollo API

```bash
# Get folders
GET http://localhost:3001/apollo/api/folder/detailed?foldersOnly=true&page=1&pageSize=65536

# Filter data
GET http://localhost:3001/apollo/api/data/filter?rsqlQuery=parent==UUID&pageSize=50&page=1

# Get data by ID
GET http://localhost:3001/apollo/api/data/{dataId}

# All other Apollo API endpoints work the same way
ALL http://localhost:3001/apollo/api/*
```

### WMS Services

```bash
# GetCapabilities
GET http://localhost:3001/apollo/ogc/wms/preview_data_{dataId}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0

# GetMap
GET http://localhost:3001/apollo/ogc/wms/preview_data_{dataId}?SERVICE=WMS&REQUEST=GetMap&...
```

### Health Check

```bash
GET http://localhost:3001/health
```

---

## 🔧 Configuration

### Change Port

Edit `server.js`:

```javascript
const PORT = 3001; // Change to your desired port
```

### Restrict CORS Origins

Edit `server.js`:

```javascript
app.use(cors({
  origin: 'http://192.168.18.169', // Only allow this origin
  credentials: true,
  // ...
}));
```

### Change Target Server

Edit the target URLs in `server.js`:

```javascript
const targetUrl = `https://nvcm.geosystems-me.com/apollo/api/${apiPath}`;
// Change to your server
```

---

## 🌐 Update Your Application Config

Update `core/lib/config/keycloak.json`:

```json
{
  "url": "http://localhost:3001/keycloak/realms/ApolloSrv/protocol/openid-connect/token",
  "clientId": "apollo-api",
  "clientSecret": "55PHxvAFM9s09sqAjjcPza8Umhtm6nLa",
  "grantType": "client_credentials",
  "scope": "openid profile email",
  "apiBaseUrl": "http://localhost:3001/apollo/api",
  "useProxy": false,
  "proxyUrl": ""
}
```

**Key changes:**
- `url`: Points to proxy server
- `apiBaseUrl`: Points to proxy server
- `useProxy`: Set to `false` (we're using direct URLs to proxy)

---

## 📊 How It Works

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Your Browser   │────────▶│  Proxy Server   │────────▶│  Real Servers   │
│  Application    │         │  (localhost:    │         │  (nvcm.geo...)  │
│                 │◀────────│   3001)         │◀────────│                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
   http://192.168.           Adds CORS headers          https://nvcm...
   18.169                    Forwards requests
```

**Flow:**
1. Browser makes request to `http://localhost:3001`
2. Proxy server forwards to `https://nvcm.geosystems-me.com`
3. Proxy receives response and adds CORS headers
4. Browser receives response (no CORS error!)

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Change the PORT in `server.js` or kill the process using port 3001:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Module Not Found

```bash
Error: Cannot find module 'express'
```

**Solution:** Run `npm install` again

### Connection Refused

**Solution:** Make sure the proxy server is running:
```bash
npm start
```

---

## 📝 Example Usage

### Test with cURL

```bash
# Get Keycloak token
curl -X POST http://localhost:3001/keycloak/realms/ApolloSrv/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=apollo-api" \
  -d "client_secret=55PHxvAFM9s09sqAjjcPza8Umhtm6nLa" \
  -d "scope=openid profile email"

# Use token to get folders
curl http://localhost:3001/apollo/api/folder/detailed?foldersOnly=true&page=1&pageSize=100 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test with JavaScript

```javascript
// Get token
const tokenResponse = await fetch('http://localhost:3001/keycloak/realms/ApolloSrv/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'apollo-api',
    client_secret: '55PHxvAFM9s09sqAjjcPza8Umhtm6nLa',
    scope: 'openid profile email'
  })
});

const { access_token } = await tokenResponse.json();

// Use token
const foldersResponse = await fetch('http://localhost:3001/apollo/api/folder/detailed?foldersOnly=true', {
  headers: { Authorization: `Bearer ${access_token}` }
});

const folders = await foldersResponse.json();
console.log(folders);
```

---

## 🔒 Security Notes

⚠️ **Important:**
- This proxy exposes your Keycloak client secret
- Only use in development or trusted networks
- For production, use backend authentication
- Consider environment variables for secrets

**Production Setup:**
```javascript
// Use environment variables
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;
```

---

## 📦 Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name apollo-proxy
pm2 save
pm2 startup
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t apollo-proxy .
docker run -p 3001:3001 apollo-proxy
```

---

## 📄 License

MIT

---

## 🆘 Support

For issues or questions, check the console output when making requests. The proxy logs all requests and errors.

**Console Output Example:**
```
📥 POST /keycloak/realms/ApolloSrv/protocol/openid-connect/token
🔑 Proxying Keycloak token request to: https://nvcm.geosystems-me.com/...
✅ Token obtained successfully
```
