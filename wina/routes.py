import re
import sqlite3
import uuid
from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from .catalog import BOOTHS, BOOTH_SERVICES, SERVICES
from .db import get_db
from .services import (
    build_dashboard,
    can_accept_transaction,
    generate_transaction_id,
)

bp = Blueprint("api", __name__, url_prefix="/api")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^(?:\+260|260|0)?((?:9|7)[567]\d{7})$")


def error(message, status):
    return jsonify({"error": message}), status


def payload():
    return request.get_json(silent=True) or {}


def normalise_phone(raw):
    if not isinstance(raw, str):
        return None
    cleaned = re.sub(r"[\s-]", "", raw)
    match = PHONE_RE.match(cleaned)
    return "+260" + match.group(1) if match else None


def user_public(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "phone": row["phone"],
        "email": row["email"],
    }


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            return error("Authentication required", 401)
        return view(*args, **kwargs)

    return wrapped


def all_transactions():
    rows = get_db().execute("SELECT * FROM transactions ORDER BY id").fetchall()
    return [dict(row) for row in rows]


@bp.get("/meta")
def meta():
    transactions = all_transactions()
    return jsonify(
        {
            "booths": BOOTHS,
            "services": SERVICES,
            "boothServices": BOOTH_SERVICES,
            "nextId": generate_transaction_id(transactions),
        }
    )


@bp.post("/auth/register")
def register():
    data = payload()
    name = str(data.get("name", "")).strip()
    phone = normalise_phone(data.get("phone"))
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if len(name) < 2:
        return error("Please enter your full name.", 400)
    if phone is None:
        return error("Enter a valid Zambian number, e.g. 0977123456.", 400)
    if not EMAIL_RE.match(email):
        return error("Enter a valid email address.", 400)
    if len(password) < 6:
        return error("Password must be at least 6 characters.", 400)

    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
        return error("That email is already registered.", 409)
    if db.execute("SELECT 1 FROM users WHERE phone = ?", (phone,)).fetchone():
        return error("That phone number is already registered.", 409)

    user_id = "U" + uuid.uuid4().hex[:12]
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        db.execute(
            """
            INSERT INTO users (id, name, phone, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                name,
                phone,
                email,
                generate_password_hash(password),
                created_at,
            ),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return error("That account already exists.", 409)

    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify({"user": user_public(row)}), 201


@bp.post("/auth/login")
def login():
    data = payload()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return error("Enter your email and password.", 400)

    row = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row is None or not check_password_hash(row["password_hash"], password):
        return error("Incorrect email or password.", 401)

    session.clear()
    session["user_id"] = row["id"]
    return jsonify({"user": user_public(row)})


@bp.post("/auth/logout")
def logout():
    session.clear()
    return "", 204


@bp.get("/auth/me")
@login_required
def me():
    return jsonify({"user": user_public(current_user())})


@bp.get("/transactions")
@login_required
def list_transactions():
    return jsonify({"transactions": all_transactions()})


@bp.post("/transactions")
@login_required
def create_transaction():
    data = payload()
    booth = str(data.get("booth", "")).strip()
    service = str(data.get("service", "")).strip()

    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return error("Enter a valid transaction amount.", 400)

    if booth not in BOOTHS:
        return error("Unknown booth.", 400)
    if service not in SERVICES:
        return error("Unknown service.", 400)
    if service not in BOOTH_SERVICES[booth]:
        return error(f"{service} is not offered at {booth}.", 400)
    if amount <= 0:
        return error("Amount must be greater than zero.", 400)

    transactions = all_transactions()

    limit = can_accept_transaction(transactions, service, amount)
    if not limit["allowed"]:
        response = {"error": limit["reason"]}
        if "remaining" in limit:
            response["remaining"] = limit["remaining"]
        if "shortfall" in limit:
            response["shortfall"] = limit["shortfall"]
        return jsonify(response), 422

    record = {
        "id": generate_transaction_id(transactions),
        "booth": booth,
        "location": BOOTHS[booth],
        "service": service,
        "rate": SERVICES[service]["rate"],
        "amount": round(amount, 2),
    }

    db = get_db()
    try:
        db.execute(
            """
            INSERT INTO transactions (id, booth, location, service, rate, amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record["booth"],
                record["location"],
                record["service"],
                record["rate"],
                record["amount"],
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return error("Could not save the transaction. Please retry.", 409)

    transactions.append(record)
    record["nextId"] = generate_transaction_id(transactions)
    return jsonify({"transaction": record}), 201


@bp.get("/dashboard")
@login_required
def dashboard():
    return jsonify(build_dashboard(all_transactions()))
