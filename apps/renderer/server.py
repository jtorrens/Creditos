#!/usr/bin/env python3
import cgi
import datetime
import json
import mimetypes
import os
import sqlite3
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from import_models.registry import DEFAULT_IMPORT_MODEL_ID, list_import_models, parse_source


ROOT = Path(__file__).resolve().parent
DOCUMENT_KINDS = {"source", "structure", "render", "reference"}


def default_db_path():
    if os.environ.get("CREDITOS_DB_PATH"):
        return Path(os.environ["CREDITOS_DB_PATH"]).expanduser()
    return ROOT.parents[1] / "data" / "creditos.db"


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def db_connect(db_path):
    path = Path(db_path).expanduser() if db_path else default_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    init_db(connection)
    return connection


def init_db(connection):
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS productions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            page_width INTEGER NOT NULL DEFAULT 1920,
            page_height INTEGER NOT NULL DEFAULT 1080,
            preview_background TEXT NOT NULL DEFAULT '#ffffff',
            import_model_id TEXT NOT NULL DEFAULT 'standard_credits_xls',
            settings_json TEXT NOT NULL DEFAULT '{}',
            episode_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            episode_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_number),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            episode_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            schema TEXT,
            version INTEGER,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, episode_id, kind),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
            FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS styles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            production_id INTEGER NOT NULL,
            style_id TEXT NOT NULL,
            name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE (production_id, style_id),
            FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE
        );
        """
    )
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(productions)")}
    if "page_width" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN page_width INTEGER NOT NULL DEFAULT 1920")
    if "page_height" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN page_height INTEGER NOT NULL DEFAULT 1080")
    if "preview_background" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN preview_background TEXT NOT NULL DEFAULT '#ffffff'")
    if "import_model_id" not in columns:
        connection.execute(
            "ALTER TABLE productions ADD COLUMN import_model_id TEXT NOT NULL DEFAULT 'standard_credits_xls'"
        )
    if "settings_json" not in columns:
        connection.execute("ALTER TABLE productions ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'")
    connection.commit()


def row_to_dict(row):
    if row is None:
        return None
    value = dict(row)
    if "settings_json" in value:
        try:
            value["settings"] = json.loads(value.pop("settings_json") or "{}")
        except json.JSONDecodeError:
            value["settings"] = {}
    return value


def db_overview(connection):
    productions = [row_to_dict(row) for row in connection.execute(
        """
        SELECT id, name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at
        FROM productions
        ORDER BY name COLLATE NOCASE
        """
    )]
    episodes = [row_to_dict(row) for row in connection.execute(
        """
        SELECT
            episodes.id,
            episodes.production_id,
            episodes.episode_number,
            episodes.name,
            episodes.created_at,
            episodes.updated_at,
            EXISTS (
                SELECT 1
                FROM documents
                WHERE documents.episode_id = episodes.id
            ) AS has_documents
        FROM episodes
        ORDER BY production_id, episode_number
        """
    )]
    return {
        "db_path": str(default_db_path()),
        "productions": productions,
        "episodes": episodes,
        "import_models": list_import_models(),
    }


def create_production(
    connection,
    name,
    episode_count,
    page_width=1920,
    page_height=1080,
    preview_background="#ffffff",
    import_model_id=None,
    settings=None,
):
    clean_name = str(name or "").strip()
    if not clean_name:
        raise ValueError("La produccion necesita nombre.")
    count = max(1, int(episode_count or 1))
    timestamp = now_iso()
    cursor = connection.execute(
        """
        INSERT INTO productions (name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            clean_name,
            max(1, int(page_width or 1920)),
            max(1, int(page_height or 1080)),
            str(preview_background or "#ffffff").strip() or "#ffffff",
            str(import_model_id or DEFAULT_IMPORT_MODEL_ID),
            json.dumps(settings if isinstance(settings, dict) else {}, ensure_ascii=False),
            count,
            timestamp,
            timestamp,
        ),
    )
    production_id = cursor.lastrowid
    width = max(2, len(str(count)))
    for number in range(1, count + 1):
        connection.execute(
            """
            INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (production_id, number, f"Episodio {number:0{width}d}", timestamp, timestamp),
        )
    connection.commit()
    return production_id


def unique_production_name(connection, base_name):
    clean_base = str(base_name or "Produccion").strip() or "Produccion"
    existing = {
        row["name"].lower()
        for row in connection.execute("SELECT name FROM productions")
    }
    if clean_base.lower() not in existing:
        return clean_base
    index = 2
    while True:
        candidate = f"{clean_base} {index}"
        if candidate.lower() not in existing:
            return candidate
        index += 1


def delete_production(connection, production_id):
    connection.execute("DELETE FROM productions WHERE id = ?", (int(production_id),))
    connection.commit()


def duplicate_production(connection, production_id):
    source = connection.execute(
        """
        SELECT name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count
        FROM productions
        WHERE id = ?
        """,
        (int(production_id),),
    ).fetchone()
    if not source:
        raise ValueError("Produccion no encontrada.")

    timestamp = now_iso()
    name = unique_production_name(connection, f"{source['name']} copia")
    cursor = connection.execute(
        """
        INSERT INTO productions (name, page_width, page_height, preview_background, import_model_id, settings_json, episode_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            int(source["page_width"] or 1920),
            int(source["page_height"] or 1080),
            source["preview_background"] or "#ffffff",
            source["import_model_id"] or DEFAULT_IMPORT_MODEL_ID,
            source["settings_json"] or "{}",
            int(source["episode_count"] or 0),
            timestamp,
            timestamp,
        ),
    )
    new_production_id = cursor.lastrowid

    episode_map = {}
    episodes = connection.execute(
        """
        SELECT id, episode_number, name
        FROM episodes
        WHERE production_id = ?
        ORDER BY episode_number
        """,
        (int(production_id),),
    ).fetchall()
    for episode in episodes:
        new_episode = connection.execute(
            """
            INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (new_production_id, episode["episode_number"], episode["name"], timestamp, timestamp),
        )
        episode_map[episode["id"]] = new_episode.lastrowid

    for document in connection.execute(
        """
        SELECT episode_id, kind, schema, version, data_json
        FROM documents
        WHERE production_id = ?
        """,
        (int(production_id),),
    ):
        new_episode_id = episode_map.get(document["episode_id"])
        if not new_episode_id:
            continue
        connection.execute(
            """
            INSERT INTO documents (production_id, episode_id, kind, schema, version, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                new_production_id,
                new_episode_id,
                document["kind"],
                document["schema"],
                document["version"],
                document["data_json"],
                timestamp,
                timestamp,
            ),
        )

    for style in connection.execute(
        """
        SELECT style_id, name, data_json
        FROM styles
        WHERE production_id = ?
        """,
        (int(production_id),),
    ):
        connection.execute(
            """
            INSERT INTO styles (production_id, style_id, name, data_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (new_production_id, style["style_id"], style["name"], style["data_json"], timestamp, timestamp),
        )

    connection.commit()
    return new_production_id


def update_production(connection, production_id, fields):
    allowed = {}
    timestamp = now_iso()
    if "name" in fields:
        name = str(fields.get("name") or "").strip()
        if not name:
            raise ValueError("La produccion necesita nombre.")
        allowed["name"] = name
    if "episode_count" in fields:
        production_id = int(production_id)
        next_count = max(1, int(fields.get("episode_count") or 1))
        current_rows = connection.execute(
            """
            SELECT episode_number
            FROM episodes
            WHERE production_id = ?
            ORDER BY episode_number
            """,
            (production_id,),
        ).fetchall()
        current_numbers = {int(row["episode_number"]) for row in current_rows}
        current_count = max(current_numbers) if current_numbers else 0
        width = max(2, len(str(next_count)))
        for number in range(1, next_count + 1):
            if number in current_numbers:
                continue
            connection.execute(
                """
                INSERT INTO episodes (production_id, episode_number, name, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (production_id, number, f"Episodio {number:0{width}d}", timestamp, timestamp),
            )
        if next_count < current_count:
            connection.execute(
                """
                DELETE FROM episodes
                WHERE production_id = ? AND episode_number > ?
                """,
                (production_id, next_count),
            )
        allowed["episode_count"] = next_count
    if "page_width" in fields:
        allowed["page_width"] = max(1, int(fields.get("page_width") or 1920))
    if "page_height" in fields:
        allowed["page_height"] = max(1, int(fields.get("page_height") or 1080))
    if "preview_background" in fields:
        allowed["preview_background"] = str(fields.get("preview_background") or "#ffffff").strip() or "#ffffff"
    if "import_model_id" in fields:
        allowed["import_model_id"] = str(fields.get("import_model_id") or DEFAULT_IMPORT_MODEL_ID)
    if "settings" in fields:
        settings = fields.get("settings")
        allowed["settings_json"] = json.dumps(settings if isinstance(settings, dict) else {}, ensure_ascii=False)
    if not allowed:
        return
    allowed["updated_at"] = timestamp
    assignments = ", ".join(f"{key} = ?" for key in allowed)
    connection.execute(
        f"UPDATE productions SET {assignments} WHERE id = ?",
        [*allowed.values(), int(production_id)],
    )
    connection.commit()


def save_document(connection, production_id, episode_id, kind, data):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    if not isinstance(data, dict):
        raise ValueError("El documento debe ser un objeto.")
    timestamp = now_iso()
    schema = data.get("schema")
    version = data.get("version")
    connection.execute(
        """
        INSERT INTO documents (production_id, episode_id, kind, schema, version, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, episode_id, kind) DO UPDATE SET
            schema = excluded.schema,
            version = excluded.version,
            data_json = excluded.data_json,
            updated_at = excluded.updated_at
        """,
        (
            int(production_id),
            int(episode_id),
            kind,
            schema,
            version if isinstance(version, int) else None,
            json.dumps(data, ensure_ascii=False),
            timestamp,
            timestamp,
        ),
    )
    connection.commit()


def load_document(connection, production_id, episode_id, kind):
    if kind not in DOCUMENT_KINDS:
        raise ValueError("Tipo de documento no valido.")
    row = connection.execute(
        """
        SELECT data_json
        FROM documents
        WHERE production_id = ? AND episode_id = ? AND kind = ?
        """,
        (int(production_id), int(episode_id), kind),
    ).fetchone()
    return json.loads(row["data_json"]) if row else None


def save_style(connection, production_id, data):
    if not isinstance(data, dict):
        raise ValueError("El estilo debe ser un objeto.")
    style_id = str(data.get("id") or "").strip()
    if not style_id:
        raise ValueError("El estilo necesita id.")
    name = str(data.get("name") or style_id).strip()
    timestamp = now_iso()
    connection.execute(
        """
        INSERT INTO styles (production_id, style_id, name, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(production_id, style_id) DO UPDATE SET
            name = excluded.name,
            data_json = excluded.data_json,
            updated_at = excluded.updated_at
        """,
        (int(production_id), style_id, name, json.dumps(data, ensure_ascii=False), timestamp, timestamp),
    )
    connection.commit()


def load_styles(connection, production_id):
    rows = connection.execute(
        """
        SELECT data_json
        FROM styles
        WHERE production_id = ?
        ORDER BY name COLLATE NOCASE
        """,
        (int(production_id),),
    )
    return [json.loads(row["data_json"]) for row in rows]


def delete_style(connection, production_id, style_id):
    connection.execute(
        "DELETE FROM styles WHERE production_id = ? AND style_id = ?",
        (int(production_id), str(style_id or "")),
    )
    connection.commit()


def import_credit_source(file_bytes, source_name, import_model_id=None, options=None):
    return parse_source(file_bytes, source_name, import_model_id or DEFAULT_IMPORT_MODEL_ID, options)


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
