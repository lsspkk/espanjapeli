#!/usr/bin/env python3
"""
Simple HTTP server with automatic browser reload
Uses livereload library for hot reloading
"""

from livereload import Server
import os
from pathlib import Path

# Configuration
PORT = 8000
DIRECTORY = Path(__file__).parent

def main():
    """Start the server with hot reload"""
    os.chdir(DIRECTORY)
    
    print("=" * 60)
    print("🚀 Starting Development Server with Live Reload")
    print("=" * 60)
    print(f"📁 Serving directory: {DIRECTORY}")
    print(f"🌐 Server running at: http://localhost:{PORT}")
    print(f"📝 Open: http://localhost:{PORT}/index.html")
    print("=" * 60)
    print("✨ Browser will auto-reload on file changes!")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    # Create server instance
    server = Server()
    
    # Watch for file changes
    server.watch('*.html')
    server.watch('*.js')
    server.watch('*.css')
    
    # Start server and open browser
    server.serve(port=PORT, host='localhost', root='.', open_url_delay=1)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 Make sure to install livereload:")
        print("   pip install livereload")
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped successfully!")


