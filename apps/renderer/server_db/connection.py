import os
import sqlite3
from pathlib import Path

from .schema import init_db


RENDERER_ROOT = Path(__file__).resolve().parents[1]


def default_db_path():
    if os.environ.get("CREDITOS_DB_PATH"):
        return Path(os.environ["CREDITOS_DB_PATH"]).expanduser()
    return RENDERER_ROOT.parents[1] / "data" / "creditos.db"


def db_connect(db_path):
    path = Path(db_path).expanduser() if db_path else default_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(str(path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    init_db(connection)
    return connection
