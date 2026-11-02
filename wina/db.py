import json
import sqlite3
from pathlib import Path

from flask import current_app, g


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = get_db()
    with current_app.open_resource("schema.sql") as schema:
        db.executescript(schema.read().decode("utf-8"))
    seed_db(db)
    db.commit()


def seed_db(db):
    count = db.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    if count > 0:
        return

    seed_path = Path(current_app.config["SEED_FILE"])
    if not seed_path.exists():
        return

    records = json.loads(seed_path.read_text(encoding="utf-8"))
    db.executemany(
        """
        INSERT INTO transactions (id, booth, location, service, rate, amount)
        VALUES (:id, :booth, :location, :service, :rate, :amount)
        """,
        records,
    )


def init_app(app):
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()
