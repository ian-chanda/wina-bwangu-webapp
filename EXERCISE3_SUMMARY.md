# Exercise 3 — Implementation Summary

**Project:** Wina Bwangu Web App
**Assignment:** Logbook Exercise 3 — Server-side Prototype, Responsive Design, Test Plan
**Role:** HERMES (Role 1 — Lead / Integration)

---

## What changed

### Requirement 1 — Server-side prototype

- Added a Flask application: `run.py`, `wina/`
- Added SQLite persistence at `instance/wina.sqlite`, seeded from `transactions.json`
- The server now owns:
  - User registration and login
  - Password hashing
  - Session cookies
  - Transaction storage
  - Server-generated transaction IDs
  - Monthly-limit enforcement
  - Dashboard calculations
- The browser no longer uses `localStorage` or `sessionStorage` for auth or transaction data
- All frontend scripts call `/api/*` through `api.js`

### Requirement 2 — Responsive design

- Added mobile header/nav wrapping
- Made transaction form controls full width on small screens
- Charts stack in one column on phones
- Dashboard tables scroll horizontally
- Added a session-check state that hides the page until authentication is confirmed
- Auth page already swaps forms and hides the sliding overlay on mobile

### Requirement 3 — Test plan and execution

- Added 10 unit tests for pure calculations
- Added 13 regression tests for the Flask API
- Result: **23/23 tests passed**
- Live server smoke test passed:
  - Register: `201`
  - Login: `200`
  - Dashboard baseline: 308 transactions, revenue `32,033.69`, capital `740,000`, VAT `89,756.28`
  - Next ID: `WB0000309`
  - Create transaction: assigned `WB0000309`, next ID `WB0000310`
- Full plan and execution record: `TEST_PLAN.md`

---

## Architecture

```text
Browser
  |  fetch /api/*
  v
Flask (run.py + wina/)
  |  sessions, validation, calculations
  v
SQLite (instance/wina.sqlite)
```

The server is the source of truth. The browser only renders the UI and sends requests.

---

## Why Chart.js is vendored

The original `index.html` loaded Chart.js from a CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
```

On a slow internet connection that blocked the app scripts and made login/dashboard loading feel slow.

It now loads from:

```html
<script src="vendor/chart.umd.min.js"></script>
```

This removes the internet dependency for the chart library. It does **not** remove the Flask server. The browser still needs the running Flask app for login, transactions, and dashboard data.

---

## Run it

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python run.py
```

Open:

```text
http://127.0.0.1:5000/
http://127.0.0.1:5000/auth.html
```

Do not open `index.html` directly with `file://`. The API calls need the Flask server.

---

## Run tests

```bash
.venv/bin/python -m unittest discover -s tests -v
```

Expected result:

```text
Ran 23 tests ...

OK
```

---

## Notes

- Nothing has been committed or pushed.
- `data.js` and `chart.js` are still in the repo but are no longer loaded; they are legacy client-side files.
- `vendor/chart.umd.min.js` is a local copy of Chart.js 4.4.1.
- The default Flask secret key is a development placeholder. Set `SECRET_KEY` in the environment for any non-local deployment.
- Responsive checklist items V-01 to V-07 in `TEST_PLAN.md` should be demonstrated at 375px, 768px, and 1280px before submission.
