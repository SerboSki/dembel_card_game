#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import http.server, socketserver, webbrowser, time, os, sys
from pathlib import Path

PORT = 8000
class MyHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    os.chdir(Path(__file__).parent)
    print("="*60)
    print("🃏 JEU DU Dembel - Serveur de lancement")
    print("="*60)
    print(f"✨ Démarrage du serveur sur le port {PORT}...")
    print(f"🌐 Accès: http://localhost:{PORT}")
    print("❌ Appuyez sur Ctrl+C pour arrêter le serveur")
    print("="*60)
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        print("✅ Serveur démarré!")
        time.sleep(1)
        print("🚀 Ouverture du navigateur...")
        webbrowser.open(f"http://localhost:{PORT}")
        try: httpd.serve_forever()
        except KeyboardInterrupt: print("\n🛑 Serveur arrêté."); sys.exit(0)

if __name__=="__main__":
    main()
