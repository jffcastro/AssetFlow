# PricEmpire CORS Proxy Server

## Problem
The PricEmpire API doesn't allow direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. When attempting to fetch data directly from `https://api.pricempire.com` from a browser application running on `localhost`, you'll encounter this error:

```
Access to fetch at 'https://api.pricempire.com/v4/trader/portfolios' from origin 'http://localhost:5500' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution
A local proxy server that:
1. Receives requests from your browser application
2. Forwards them to the PricEmpire API with proper headers
3. Returns the API response with CORS headers enabled
4. Runs on your local machine (localhost:3000)

## Setup

### Prerequisites
- **Option A**: Node.js installed (v14 or higher) - for `proxy-server.js`
- **Option B**: Python 3 installed (v3.6 or higher) - for `proxy-server.py`

### Installation
No additional packages required - both proxy implementations use only built-in modules.

## Usage

### 1. Start the Proxy Server

**Option A: Using Python (recommended if Node.js not installed)**
```bash
python3 proxy-server.py
```

**Option B: Using npm script**
```bash
npm run proxy
```

**Option C: Using Node.js directly**
```bash
node proxy-server.js
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║  PricEmpire CORS Proxy Server                             ║
║  Running on http://localhost:3000                         ║
║                                                           ║
║  Proxy endpoint: http://localhost:3000/api/pricempire     ║
║  Target API: https://api.pricempire.com                   ║
║                                                           ║
║  Press Ctrl+C to stop the server                         ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Start the Application Server

In a **separate terminal**, start the HTTP server for the application:

```bash
python3 -m http.server 8000
# or
python3 -m http.server 5500
```

### 3. Access the Application

Open your browser and navigate to:
- `http://localhost:8000/cs2.html` (if using port 8000)
- `http://localhost:5500/cs2.html` (if using port 5500)

The CS2 page will now successfully fetch data from PricEmpire through the proxy.

## How It Works

### Request Flow
```
Browser (localhost:8000)
    ↓ fetch('http://localhost:3000/api/pricempire/v4/trader/portfolios')
Proxy Server (localhost:3000)
    ↓ https.request('https://api.pricempire.com/v4/trader/portfolios')
PricEmpire API
    ↓ JSON response
Proxy Server (adds CORS headers)
    ↓ Response with Access-Control-Allow-Origin: *
Browser (receives data)
```

### Proxy Endpoint Mapping
- **Frontend calls**: `http://localhost:3000/api/pricempire/v4/trader/portfolios`
- **Proxy forwards to**: `https://api.pricempire.com/v4/trader/portfolios`

The `/api/pricempire` prefix is stripped by the proxy before forwarding.

## Configuration

### Change Proxy Port
Edit `proxy-server.js`:
```javascript
const PORT = 3000; // Change to your preferred port
```

And update `js/cs2.js`:
```javascript
const proxyUrl = 'http://localhost:3000/api/pricempire/v4/trader/portfolios';
//                                    ↑↑↑↑
//                                    Update port here
```

## Logging

The proxy server logs all requests and responses:

```
[2025-12-23T10:30:45.123Z] Proxying GET request to https://api.pricempire.com/v4/trader/portfolios
[2025-12-23T10:30:45.789Z] PricEmpire responded with status: 200
```

## Error Handling

### Common Errors

#### 1. Proxy Not Running
**Error in browser console:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:** Start the proxy server (`npm run proxy`)

#### 2. Wrong Port
**Error in browser console:**
```
Failed to fetch
net::ERR_CONNECTION_REFUSED
```

**Solution:** Ensure proxy is running on port 3000, or update the port in cs2.js

#### 3. Missing Authorization Header
**Error from proxy:**
```json
{
  "error": "Authorization header required"
}
```

**Solution:** Ensure you've configured your PricEmpire API key in the Configurations page

#### 4. Invalid API Key
**Error from proxy:**
```
API request failed: 401 Unauthorized
```

**Solution:** Check your PricEmpire API key in Configurations page

## Security Notes

### Local Development Only
This proxy is designed for **local development only**. Do NOT deploy this proxy to production as-is because:
- It allows requests from any origin (`Access-Control-Allow-Origin: *`)
- It has no rate limiting
- It has no authentication beyond the API key
- It logs sensitive data

### Production Deployment
For production, consider:
1. Using a proper backend server (Express.js, etc.)
2. Implementing rate limiting
3. Restricting CORS to specific origins
4. Adding request validation
5. Implementing proper logging and monitoring
6. Using environment variables for configuration

## Stopping the Proxy

Press `Ctrl+C` in the terminal where the proxy is running:

```
^C
Shutting down proxy server...
Proxy server stopped.
```

## Troubleshooting

### "Port already in use" error
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Stop the existing process using port 3000
2. Change the PORT in proxy-server.js to a different port (e.g., 3001)

### Find and kill process on port 3000 (Linux/Mac):
```bash
lsof -i :3000
kill -9 <PID>
```

### Find and kill process on port 3000 (Windows):
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Development Workflow

### Recommended Setup
1. **Terminal 1**: Run proxy server
   ```bash
   npm run proxy
   ```

2. **Terminal 2**: Run application server
   ```bash
   python3 -m http.server 8000
   ```

3. **Browser**: Open `http://localhost:8000/cs2.html`

### Keep Both Running
Both servers need to remain running for the CS2 API integration to work:
- Proxy server handles PricEmpire API requests
- Application server serves HTML/CSS/JS files

## Alternative Solutions

If you prefer not to run a local proxy server, alternatives include:

1. **Browser Extension**: CORS Unblock or similar (not recommended for security)
2. **Backend Integration**: Build a proper Node.js/Python backend API
3. **Serverless Functions**: Use Vercel/Netlify functions as proxy
4. **PricEmpire SDK**: Check if PricEmpire provides a JavaScript SDK

## Files Modified

- `proxy-server.js` - New proxy server implementation
- `js/cs2.js` - Updated to use proxy URL instead of direct API
- `package.json` - Added `npm run proxy` script

## License

Same as main AssetFlow project (MIT License)
