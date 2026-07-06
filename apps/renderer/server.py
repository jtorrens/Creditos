#!/usr/bin/env python3
import cgi
import json
import mimetypes
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from import_models.registry import DEFAULT_IMPORT_MODEL_ID
from server_db.connection import db_connect
from server_services.import_service import import_credit_source
from server_services.document_service import load_document, save_document
from server_services.project_service import (
    create_production,
    db_overview,
    delete_production,
    duplicate_production,
    update_production,
)
from server_services.style_service import delete_style, load_styles, save_style


ROOT = Path(__file__).resolve().parent


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlsplit(self.path)
        path = unquote(parsed_url.path)
        if path == "/api/reference-video":
            self.handle_reference_video(parsed_url.query)
            return
        if path == "/":
            path = "/index.html"
        file_path = (ROOT / path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.exists() or file_path.is_dir():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_reference_video(self, query):
        params = parse_qs(query)
        source_path = params.get("path", [""])[0]
        if not source_path:
            self.send_error(404)
            return
        file_path = Path(source_path).expanduser()
        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return

        file_size = file_path.stat().st_size
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        range_header = self.headers.get("Range")
        start = 0
        end = file_size - 1
        status = 200

        if range_header and range_header.startswith("bytes="):
            status = 206
            range_value = range_header.split("=", 1)[1].split(",", 1)[0]
            start_text, _, end_text = range_value.partition("-")
            if start_text:
                start = max(0, int(start_text))
            if end_text:
                end = min(file_size - 1, int(end_text))
            if start > end:
                self.send_error(416)
                return

        chunk_size = end - start + 1
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(chunk_size))
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
        self.end_headers()
        with file_path.open("rb") as handle:
            handle.seek(start)
            remaining = chunk_size
            while remaining > 0:
                data = handle.read(min(1024 * 1024, remaining))
                if not data:
                    break
                self.wfile.write(data)
                remaining -= len(data)

    def do_POST(self):
        path = unquote(self.path.split("?", 1)[0])
        if path == "/api/parse-xlsx":
            self.handle_import_credit_source()
            return
        if path.startswith("/api/db/"):
            self.handle_db(path)
            return
        self.send_error(404)

    def handle_import_credit_source(self):
        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={"REQUEST_METHOD": "POST"})
            uploaded = form["file"]
            file_bytes = uploaded.file.read()
            source_name = uploaded.filename or "uploaded_source"
            import_model_id = form.getfirst("import_model_id") or DEFAULT_IMPORT_MODEL_ID
            parsed = import_credit_source(file_bytes, source_name, import_model_id)
            self.send_json(200, parsed)
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def handle_db(self, path):
        try:
            payload = self.read_json_body()
            db_path = payload.get("db_path")
            with db_connect(db_path) as connection:
                if path in {"/api/db/init", "/api/db/list"}:
                    self.send_json(200, db_overview(connection))
                    return

                if path == "/api/db/create-production":
                    production_id = create_production(
                        connection,
                        payload.get("name"),
                        payload.get("episode_count"),
                        payload.get("page_width"),
                        payload.get("page_height"),
                        payload.get("preview_background"),
                        payload.get("import_model_id"),
                        payload.get("settings"),
                    )
                    self.send_json(200, {**db_overview(connection), "production_id": production_id})
                    return

                if path == "/api/db/update-production":
                    update_production(connection, payload.get("production_id"), payload.get("fields") or {})
                    self.send_json(200, db_overview(connection))
                    return

                if path == "/api/db/duplicate-production":
                    production_id = duplicate_production(connection, payload.get("production_id"))
                    self.send_json(200, {**db_overview(connection), "production_id": production_id})
                    return

                if path == "/api/db/delete-production":
                    delete_production(connection, payload.get("production_id"))
                    self.send_json(200, db_overview(connection))
                    return

                if path == "/api/db/save-document":
                    save_document(
                        connection,
                        payload.get("production_id"),
                        payload.get("episode_id"),
                        payload.get("kind"),
                        payload.get("data"),
                    )
                    self.send_json(200, {"ok": True})
                    return

                if path == "/api/db/load-document":
                    data = load_document(
                        connection,
                        payload.get("production_id"),
                        payload.get("episode_id"),
                        payload.get("kind"),
                    )
                    self.send_json(200, {"data": data})
                    return

                if path == "/api/db/load-episode":
                    production_id = payload.get("production_id")
                    episode_id = payload.get("episode_id")
                    self.send_json(
                        200,
                        {
                            "source": load_document(connection, production_id, episode_id, "source"),
                            "structure": load_document(connection, production_id, episode_id, "structure"),
                            "render": load_document(connection, production_id, episode_id, "render"),
                            "reference": load_document(connection, production_id, episode_id, "reference"),
                            "styles": load_styles(connection, production_id),
                        },
                    )
                    return

                if path == "/api/db/save-style":
                    save_style(connection, payload.get("production_id"), payload.get("data"))
                    self.send_json(200, {"ok": True})
                    return

                if path == "/api/db/delete-style":
                    delete_style(connection, payload.get("production_id"), payload.get("style_id"))
                    self.send_json(200, {"styles": load_styles(connection, payload.get("production_id"))})
                    return

                if path == "/api/db/load-styles":
                    self.send_json(200, {"styles": load_styles(connection, payload.get("production_id"))})
                    return

            self.send_error(404)
        except Exception as error:
            self.send_json(500, {"error": str(error)})

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main():
    args = [arg for arg in sys.argv[1:] if arg != "--no-open"]
    port = int(args[0]) if args else 8787
    should_open = "--no-open" not in sys.argv[1:]
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}"
    print(f"Créditos: {url}")
    print("Pulsa Ctrl+C para cerrar el servidor.")
    if should_open:
        threading.Thread(target=open_browser, args=(url,), daemon=True).start()
    server.serve_forever()


def open_browser(url):
    time.sleep(0.4)
    webbrowser.open(url)


if __name__ == "__main__":
    main()
