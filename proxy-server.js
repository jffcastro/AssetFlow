/**
 * Simple CORS Proxy Server for PricEmpire API
 * 
 * This proxy server forwards requests from the frontend to the PricEmpire API,
 * bypassing CORS restrictions by adding the necessary headers.
 * 
 * Usage: node proxy-server.js
 * The server will run on http://localhost:3000
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const PRICEMPIRE_API_BASE = 'api.pricempire.com';

const server = http.createServer((req, res) => {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Only proxy PricEmpire API requests
    if (!req.url.startsWith('/api/pricempire')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }
    
    // Extract the API path (remove /api/pricempire prefix)
    const apiPath = req.url.replace('/api/pricempire', '');
    
    // Get Authorization header from the request
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authorization header required' }));
        return;
    }
    
    // Options for the HTTPS request to PricEmpire
    const options = {
        hostname: PRICEMPIRE_API_BASE,
        port: 443,
        path: apiPath,
        method: req.method,
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'User-Agent': 'AssetFlow/1.0'
        }
    };
    
    console.log(`[${new Date().toISOString()}] Proxying ${req.method} request to https://${PRICEMPIRE_API_BASE}${apiPath}`);
    
    // Make the request to PricEmpire API
    const proxyReq = https.request(options, (proxyRes) => {
        console.log(`[${new Date().toISOString()}] PricEmpire responded with status: ${proxyRes.statusCode}`);
        
        // Forward the status code
        res.writeHead(proxyRes.statusCode, {
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        
        // Pipe the response from PricEmpire to the client
        proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Error proxying request:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Proxy error', 
            message: error.message 
        }));
    });
    
    // If the original request has a body, forward it
    if (req.method === 'POST' || req.method === 'PUT') {
        req.pipe(proxyReq);
    } else {
        proxyReq.end();
    }
});

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  PricEmpire CORS Proxy Server                             ║
║  Running on http://localhost:${PORT}                         ║
║                                                           ║
║  Proxy endpoint: http://localhost:${PORT}/api/pricempire    ║
║  Target API: https://${PRICEMPIRE_API_BASE}                  ║
║                                                           ║
║  Press Ctrl+C to stop the server                         ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down proxy server...');
    server.close(() => {
        console.log('Proxy server stopped.');
        process.exit(0);
    });
});
