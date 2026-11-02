import os
from pathlib import Path

from flask import Flask, abort, send_from_directory

FRONTEND_FILES = {
    "vendor/chart.umd.min.js",
    "style.css",
    "auth.css",
    "app.js",
    "api.js",
    "auth.js",
    "guard.js",
    "forms.js",
    "validation.js",
    "dashboard.js",
    "favicon.ico",
}


def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)
    project_root = Path(app.root_path).parent

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret-change-me"),
        DATABASE=str(Path(app.instance_path) / "wina.sqlite"),
        SEED_FILE=str(project_root / "transactions.json"),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )

    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    from . import db

    db.init_app(app)

    from .routes import bp

    app.register_blueprint(bp)

    def frontend(filename):
        return send_from_directory(project_root, filename)

    @app.get("/")
    def index():
        return frontend("index.html")

    @app.get("/auth.html")
    def auth_page():
        return frontend("auth.html")

    @app.get("/<path:filename>")
    def frontend_asset(filename):
        if filename not in FRONTEND_FILES:
            abort(404)
        return frontend(filename)

    return app
