# Wina Bwangu Web App

A Flask + SQLite prototype for recording mobile-money transactions and viewing revenue, VAT, service-limit, booth, and frequency dashboards.

## Requirements

- Python 3.10+
- Flask (installed from `requirements.txt`)

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Run

```bash
.venv/bin/python run.py
```

Open http://127.0.0.1:5000/ or go straight to the login page at http://127.0.0.1:5000/auth.html.

The SQLite database is created automatically at `instance/wina.sqlite` and seeded with the 308 case-study transactions from `transactions.json` on first run.

## Test

```bash
.venv/bin/python -m unittest discover -s tests -v
```

The test suite has unit tests for the calculations and regression tests for auth, sessions, transaction limits, dashboard totals, and frontend routing. See `TEST_PLAN.md` for the full plan and execution record.

## Project layout

```text
run.py               Flask entry point
wina/                Flask app, routes, database, calculations
tests/               Unit and regression tests
transactions.json    Seed data (308 records)
vendor/              Local Chart.js copy (no CDN / internet required)
index.html           Main app page
auth.html            Sign-in / sign-up page
app.js               Navigation and VAT preview helpers
api.js               Browser API client
forms.js             Transaction form
dashboard.js         Dashboard rendering and charts
auth.js              Auth page UI
guard.js             Server-session guard
style.css            Main styles
auth.css             Auth page styles
```

## Notes

- The server is the source of truth for users, sessions, transactions, IDs, and dashboard calculations.
- Passwords are hashed with Werkzeug; sessions use Flask's signed session cookie.
- Set `SECRET_KEY` in the environment before any non-local deployment.
- Chart.js is vendored at `vendor/chart.umd.min.js`, so the app works without internet.
- `data.js` and `chart.js` are legacy client-side files and are no longer loaded by `index.html`.
