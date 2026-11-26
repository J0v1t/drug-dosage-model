"""Loopback-only local application. Run: python app.py"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from urllib.parse import urlsplit
import webbrowser

from pkmodel import parameters, simulate

WEB = Path(__file__).resolve().parent / "web"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def do_POST(self):
        if self.path != "/api/simulate":
            self.send_error(404)
            return
        origin = self.headers.get("Origin")
        if origin and urlsplit(origin).netloc != self.headers.get("Host"):
            self.reply(403, {"error": "Use the local application to run simulations."})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 4096:
                raise ValueError("Invalid request size.")
            if self.headers.get_content_type() != "application/json":
                raise ValueError("Expected JSON simulation parameters.")
            payload = json.loads(self.rfile.read(size))
            result = simulate(parameters(payload))
            self.reply(200, result)
        except (ValueError, TypeError) as exc:
            self.reply(400, {"error": str(exc)})
        except RuntimeError as exc:
            self.reply(500, {"error": str(exc)})

    def reply(self, status, value):
        encoded = json.dumps(value, allow_nan=False, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        try:
            self.wfile.write(encoded)
        except (BrokenPipeError, ConnectionResetError):
            pass  # A newer slider request may supersede this response.


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Small Dose local pharmacokinetics lab")
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--open", action="store_true", help="Open the application in your browser")
    args = parser.parse_args()
    url = f"http://localhost:{args.port}"
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(Handler, directory=str(WEB)))
    print(f"Small Dose: {url} — press Ctrl+C to stop", flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
