CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    booth TEXT NOT NULL,
    location TEXT NOT NULL,
    service TEXT NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_service ON transactions(service);
CREATE INDEX IF NOT EXISTS idx_transactions_booth ON transactions(booth);
