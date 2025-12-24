#!/usr/bin/env python3
"""
Simple CORS Proxy Server for Pricempire API

This proxy server forwards requests from the frontend to the Pricempire API,
bypassing CORS restrictions by adding the necessary headers.

Usage: python3 proxy-server.py
The server will run on http://localhost:3000
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import json
from datetime import datetime

PORT = 3000
PRICEMPIRE_API_BASE = 'https://api.pricempire.com'


class ProxyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Custom log format with timestamp"""
        timestamp = datetime.now().isoformat()
        print(f"[{timestamp}] {format % args}")

    def _set_cors_headers(self):
        """Set CORS headers to allow requests from any origin"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        self._proxy_request()

    def do_POST(self):
        """Handle POST requests"""
        self._proxy_request()

    def do_PUT(self):
        """Handle PUT requests"""
        self._proxy_request()

    def do_DELETE(self):
        """Handle DELETE requests"""
        self._proxy_request()

    def _proxy_request(self):
        """Proxy the request to Pricempire API"""
        # Only proxy Pricempire API requests
        if not self.path.startswith('/api/pricempire'):
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())
            return

        # Extract the API path (remove /api/pricempire prefix)
        api_path = self.path.replace('/api/pricempire', '')
        full_url = f"{PRICEMPIRE_API_BASE}{api_path}"

        # Get Authorization header
        auth_header = self.headers.get('Authorization')
        if not auth_header:
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Authorization header required'}).encode())
            return

        try:
            # Prepare headers for the proxied request
            headers = {
                'Authorization': auth_header,
                'Content-Type': 'application/json',
                'User-Agent': 'AssetFlow/1.0'
            }

            # Read request body if present
            content_length = int(self.headers.get('Content-Length', 0))
            request_body = self.rfile.read(content_length) if content_length > 0 else None

            print(f"Proxying {self.command} request to {full_url}")

            # Create the request
            req = urllib.request.Request(
                full_url,
                data=request_body,
                headers=headers,
                method=self.command
            )

            # Make the request to Pricempire API
            with urllib.request.urlopen(req) as response:
                response_data = response.read()
                status_code = response.getcode()

                print(f"Pricempire responded with status: {status_code}")

                # Send response to client
                self.send_response(status_code)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/json'))
                self._set_cors_headers()
                self.end_headers()
                self.wfile.write(response_data)

        except urllib.error.HTTPError as e:
            # Handle HTTP errors from Pricempire API
            print(f"HTTP Error from Pricempire: {e.code} {e.reason}")
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {
                'error': 'API request failed',
                'status': e.code,
                'message': e.reason
            }
            self.wfile.write(json.dumps(error_response).encode())

        except urllib.error.URLError as e:
            # Handle network errors
            print(f"URL Error: {e.reason}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {
                'error': 'Proxy error',
                'message': str(e.reason)
            }
            self.wfile.write(json.dumps(error_response).encode())

        except Exception as e:
            # Handle other errors
            print(f"Error proxying request: {str(e)}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {
                'error': 'Internal proxy error',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())


def run_server():
    """Start the proxy server"""
    server = HTTPServer(('localhost', PORT), ProxyHandler)
    
    print("""
╔═══════════════════════════════════════════════════════════╗
║  Pricempire CORS Proxy Server                             ║
║  Running on http://localhost:{:<4}                        ║
║                                                           ║
║  Proxy endpoint: http://localhost:{:<4}/api/pricempire    ║
║  Target API: {}                  ║
║                                                           ║
║  Press Ctrl+C to stop the server                         ║
╚═══════════════════════════════════════════════════════════╝
    """.format(PORT, PORT, PRICEMPIRE_API_BASE))
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n\nShutting down proxy server...')
        server.server_close()
        print('Proxy server stopped.')


if __name__ == '__main__':
    run_server()
