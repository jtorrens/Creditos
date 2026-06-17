#!/usr/bin/env python3
import cgi
import datetime
import json
import mimetypes
import re
import sqlite3
import sys
import threading
import time
import webbrowser
import zipfile
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parent
NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}
XMLNS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
DOCUMENT_KINDS = {"source", "structure", "render"}


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def db_connect(db_path):
    if not db_path:
        raise ValueError("No hay ruta de base de datos.")
    path = Path(db_path).expanduser()
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
    connection.commit()


def row_to_dict(row):
    return dict(row) if row is not None else None


def db_overview(connection):
    productions = [row_to_dict(row) for row in connection.execute(
        "SELECT id, name, episode_count, created_at, updated_at FROM productions ORDER BY name COLLATE NOCASE"
    )]
    episodes = [row_to_dict(row) for row in connection.execute(
        """
        SELECT id, production_id, episode_number, name, created_at, updated_at
        FROM episodes
        ORDER BY production_id, episode_number
        """
    )]
    return {"productions": productions, "episodes": episodes}


def create_production(connection, name, episode_count):
    clean_name = str(name or "").strip()
    if not clean_name:
        raise ValueError("La produccion necesita nombre.")
    count = max(1, int(episode_count or 1))
    timestamp = now_iso()
    cursor = connection.execute(
        """
        INSERT INTO productions (name, episode_count, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        """,
        (clean_name, count, timestamp, timestamp),
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


def col_from_ref(ref):
    match = re.match(r"([A-Z]+)", ref or "")
    return match.group(1) if match else ""


def normalize_group(value):
    if not value:
        return None
    try:
        number = float(value)
        return str(int(number)) if number.is_integer() else str(number)
    except ValueError:
        return value


def read_shared_strings(zip_file):
    if "xl/sharedStrings.xml" not in zip_file.namelist():
        return []
    root = ET.fromstring(zip_file.read("xl/sharedStrings.xml"))
    strings = []
    for si in root.findall("a:si", NS):
        strings.append("".join((t.text or "") for t in si.iter(f"{XMLNS}t")))
    return strings


def read_bold_styles(zip_file):
    if "xl/styles.xml" not in zip_file.namelist():
        return {}

    root = ET.fromstring(zip_file.read("xl/styles.xml"))
    fonts_node = root.find("a:fonts", NS)
    cell_xfs_node = root.find("a:cellXfs", NS)
    if fonts_node is None or cell_xfs_node is None:
        return {}

    fonts = [font.find("a:b", NS) is not None for font in fonts_node]
    bold_styles = {}
    for index, xf in enumerate(cell_xfs_node):
        font_id = int(xf.attrib.get("fontId", "0"))
        bold_styles[str(index)] = fonts[font_id] if font_id < len(fonts) else False
    return bold_styles


def cell_value(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    value = cell.find("a:v", NS)
    inline = cell.find("a:is", NS)

    if cell_type == "s" and value is not None:
        return shared_strings[int(value.text)].strip()
    if cell_type == "inlineStr" and inline is not None:
        return "".join((t.text or "") for t in inline.iter(f"{XMLNS}t")).strip()
    if cell_type == "e" and value is not None:
        return value.text.strip()
    if value is not None:
        return value.text.strip()
    return ""


def row_values(row, shared_strings):
    values = {"A": "", "B": "", "C": "", "D": ""}
    styles = {}
    for cell in row.findall("a:c", NS):
        col = col_from_ref(cell.attrib.get("r"))
        if col in values:
            values[col] = cell_value(cell, shared_strings)
            styles[col] = cell.attrib.get("s")
    return values, styles


def workbook_sheets(zip_file):
    workbook = ET.fromstring(zip_file.read("xl/workbook.xml"))
    rels = ET.fromstring(zip_file.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

    workbook_view = workbook.find("a:bookViews/a:workbookView", NS)
    active_tab = int(workbook_view.attrib.get("activeTab", "0")) if workbook_view is not None else 0

    sheets = []
    for index, sheet in enumerate(workbook.find("a:sheets", NS)):
        rel_id = sheet.attrib.get(f"{{{NS['r']}}}id")
        target = relmap[rel_id]
        if not target.startswith("xl/"):
            target = "xl/" + target.lstrip("/")
        sheets.append(
            {
                "index": index,
                "name": sheet.attrib["name"],
                "path": target,
                "is_active": index == active_tab,
            }
        )
    return sheets


def choose_sheet(sheets):
    for sheet in sheets:
        if sheet["name"].lower() == "rodillo final":
            return sheet
    for sheet in sheets:
        if sheet["is_active"]:
            return sheet
    return sheets[0]


def read_sheet_rows(zip_file, sheet_path):
    shared_strings = read_shared_strings(zip_file)
    bold_styles = read_bold_styles(zip_file)
    root = ET.fromstring(zip_file.read(sheet_path))

    merged_rows = set()
    merge_cells = root.find("a:mergeCells", NS)
    if merge_cells is not None:
        for merge in merge_cells.findall("a:mergeCell", NS):
            ref = merge.attrib.get("ref", "")
            match = re.match(r"B(\d+):D\1$", ref)
            if match:
                merged_rows.add(int(match.group(1)))

    rows = []
    for row in root.findall(".//a:sheetData/a:row", NS):
        number = int(row.attrib.get("r", "0"))
        values, styles = row_values(row, shared_strings)
        if any(values.values()):
            rows.append(
                {
                    "row": number,
                    "values": values,
                    "styles": styles,
                    "bold": {col: bold_styles.get(style, False) for col, style in styles.items()},
                    "merged_b_to_d": number in merged_rows,
                }
            )
    return rows


def new_block(row, group, title, block_type):
    return {
        "group": group,
        "title": title,
        "titles": [title],
        "type": block_type,
        "start_row": row,
        "items": [],
    }


def classify_numbered_title(title):
    if title in {"Han intervenido", "Pequeñas Partes"}:
        return "cast"
    if title == "RODILLO FINAL":
        return "crew"
    return "cards"


def append_card_item(block, row, role):
    item = {"kind": "credit", "row": row, "role": role, "names": []}
    block["items"].append(item)
    return item


def parse_rows(rows, source_name, sheet_name):
    result = {
        "source": source_name,
        "sheet": sheet_name,
        "columns": {"A": "group", "B": "role_or_name", "C": "center_title_or_role", "D": "name_or_character"},
        "blocks": [],
    }

    current_block = None
    current_card = None
    current_crew_item = None
    last_data_row = None
    active_section = None

    for entry in rows:
        row = entry["row"]
        values = entry["values"]
        a, b, c, d = values["A"], values["B"], values["C"], values["D"]
        gap = 0 if last_data_row is None else row - last_data_row

        if a and c:
            group = normalize_group(a)
            block_type = classify_numbered_title(c)
            if current_block and current_block["group"] == group and current_block["type"] == "cards":
                current_block["titles"].append(c)
            else:
                current_block = new_block(row, group, c, block_type)
                result["blocks"].append(current_block)
            current_card = None
            current_crew_item = None
            active_section = None
            if current_block["type"] == "cards":
                current_card = append_card_item(current_block, row, c)
            last_data_row = row
            continue

        if current_block is None:
            last_data_row = row
            continue

        if current_block["type"] == "cards":
            if c:
                if current_card is None or (gap > 1 and current_card["names"]):
                    current_card = append_card_item(current_block, row, c)
                else:
                    current_card["names"].append({"row": row, "name": c})

        elif current_block["type"] == "cast":
            if b and d:
                current_block["items"].append({"kind": "cast", "row": row, "actor": b, "character": d})
            elif b or c or d:
                current_block["items"].append({"kind": "unclassified", "row": row, "B": b, "C": c, "D": d})

        elif current_block["type"] == "crew":
            active_section, current_crew_item = parse_crew_row(
                current_block, entry, row, b, c, d, gap, active_section, current_crew_item
            )

        last_data_row = row

    normalize_trailing_closing_copy(result)
    return result


def section_item(row, title, source_column, source_bold=False):
    return {
        "kind": "section",
        "row": row,
        "title": title,
        "source_column": source_column,
        "source_bold": bool(source_bold),
    }


def parse_crew_row(block, entry, row, b, c, d, gap, active_section, current_crew_item):
    if entry["merged_b_to_d"] and b:
        if b in {"#VALUE!", "VOLSKWAGEN"}:
            if active_section != "Logos":
                active_section = "Logos"
                current_crew_item = None
                block["items"].append(section_item(row, active_section, "B:D", entry["bold"].get("B")))
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section == "AGRADECIMIENTOS" and entry["bold"].get("B"):
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
        elif active_section == "AGRADECIMIENTOS":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section == "Licencias Musicales":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        elif active_section not in {None, "Logos", "closing_copy"} and entry["bold"].get("B") and b != active_section:
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
        elif active_section == "closing_copy":
            block["items"].append({"kind": "closing_line", "row": row, "section": active_section, "value": b})
        elif active_section == "Vestuario" and b != "Vestuario":
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
        else:
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B:D", entry["bold"].get("B")))
    elif c and not b and not d:
        if active_section == "closing_copy":
            block["items"].append({"kind": "closing_line", "row": row, "section": active_section, "value": c})
        elif c == "Empresas de Servicios":
            active_section = c
            current_crew_item = None
            block["items"].append(section_item(row, c, "C", entry["bold"].get("C")))
        elif active_section in {"Doblaje de Figuracion", "Doblaje de Figuración"}:
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": c})
        else:
            active_section = c
            current_crew_item = None
            block["items"].append(section_item(row, c, "C", entry["bold"].get("C")))
    elif b and d:
        current_crew_item = {
            "kind": "crew_credit",
            "row": row,
            "section": active_section,
            "role": b,
            "names": [{"row": row, "name": d}],
        }
        block["items"].append(current_crew_item)
    elif d and current_crew_item:
        current_crew_item["names"].append({"row": row, "name": d})
    elif b and not c and not d:
        if b == "Licencias Musicales":
            active_section = b
            current_crew_item = None
            block["items"].append(section_item(row, b, "B", entry["bold"].get("B")))
        else:
            block["items"].append({"kind": "list_item", "row": row, "section": active_section, "value": b})
    elif c or d:
        block["items"].append({"kind": "unclassified", "row": row, "section": active_section, "B": b, "C": c, "D": d})

    return active_section, current_crew_item


def normalize_trailing_closing_copy(result):
    for block in result.get("blocks", []):
        if block.get("type") != "crew":
            continue
        items = block.get("items", [])
        suffix_start = len(items)
        while suffix_start > 0 and is_trailing_copy_suffix_candidate(items[suffix_start - 1]):
            suffix_start -= 1
        if suffix_start == len(items):
            continue
        suffix = items[suffix_start:]
        marker_offset = next(
            (index for index, item in enumerate(suffix) if looks_like_closing_copy_text(item.get("value") or item.get("title") or "")),
            None,
        )
        start = suffix_start + marker_offset if marker_offset is not None else suffix_start
        block["items"] = items[:start] + [
            {
                "kind": "closing_line",
                "row": item.get("row"),
                "section": "closing_copy",
                "value": item.get("value") or item.get("title") or "",
            }
            for item in items[start:]
        ]


def is_trailing_copy_suffix_candidate(item):
    if item.get("kind") == "closing_line":
        return True
    if item.get("kind") == "section":
        return item.get("source_column") in {"B:D", "C"} and not item.get("source_bold")
    if item.get("kind") == "list_item":
        return True
    return False


def looks_like_closing_copy_text(value):
    text = normalize_copy_text(value)
    return any(
        marker in text
        for marker in [
            "produccion",
            "colaboracion",
            "copyright",
            "deposito legal",
            "copy animado",
            "atresmedia",
        ]
    ) or "©" in str(value or "")


def normalize_copy_text(value):
    text = str(value or "").lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "ñ": "n",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"\s+", " ", text).strip()


def parse_xlsx(file_bytes, source_name):
    with zipfile.ZipFile(BytesIO(file_bytes)) as zip_file:
        sheets = workbook_sheets(zip_file)
        sheet = choose_sheet(sheets)
        rows = read_sheet_rows(zip_file, sheet["path"])
        parsed = parse_rows(rows, source_name, sheet["name"])
        parsed["workbook_sheets"] = [{"name": s["name"], "is_active": s["is_active"]} for s in sheets]
        return parsed


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = unquote(self.path.split("?", 1)[0])
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

    def do_POST(self):
        path = unquote(self.path.split("?", 1)[0])
        if path == "/api/parse-xlsx":
            self.handle_parse_xlsx()
            return
        if path.startswith("/api/db/"):
            self.handle_db(path)
            return
        self.send_error(404)

    def handle_parse_xlsx(self):
        try:
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={"REQUEST_METHOD": "POST"})
            uploaded = form["file"]
            file_bytes = uploaded.file.read()
            source_name = uploaded.filename or "uploaded.xlsx"
            parsed = parse_xlsx(file_bytes, source_name)
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
                    )
                    self.send_json(200, {**db_overview(connection), "production_id": production_id})
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
                            "styles": load_styles(connection, production_id),
                        },
                    )
                    return

                if path == "/api/db/save-style":
                    save_style(connection, payload.get("production_id"), payload.get("data"))
                    self.send_json(200, {"ok": True})
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
