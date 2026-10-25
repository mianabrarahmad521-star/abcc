"""
Quick-launch script for Abrar Ahmad's Personal Portfolio Website.
- Initializes database & seeds if needed
- Automatically starts the backend server
- Opens default browser to http://localhost:5000
"""

import os
import sys
import time
import webbrowser
import threading

# Ensure UTF-8 output on Windows terminals that default to legacy code pages
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Ensure workspace root is in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database import init_db

PORT = int(os.environ.get("PORT", 5000))
URL = f"http://localhost:{PORT}"

def open_browser():
    time.sleep(1.2)
    print(f"\n[+] Opening web browser to {URL} ...")
    webbrowser.open(URL)

if __name__ == '__main__':
    print("=" * 65)
    print(" 🚀 Starting Abrar Ahmad's Professional Portfolio & Admin Portal")
    print("=" * 65)
    
    # 1. Initialize DB
    print("[*] Initializing SQLite database...")
    init_db()
    print("[+] Database verified and ready.")

    # 2. Launch browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # 3. Start Web Server
    print(f"\n[*] Serving Portfolio at:   {URL}")
    print(f"[*] Owner Admin Dashboard: {URL}/admin")
    print(f"[*] Default Admin Login:   username='admin', password='admin123'")
    print(f"[*] Press CTRL+C to stop the server at any time.\n")

    try:
        from backend.app import app
        app.run(host='0.0.0.0', port=PORT, debug=False)
    except ImportError:
        print("[!] Flask not found, falling back to built-in standalone server...")
        from backend.server_standalone import run_standalone
        run_standalone(PORT)
