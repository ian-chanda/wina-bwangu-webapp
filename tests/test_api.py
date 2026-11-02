import tempfile
import unittest
from pathlib import Path

from wina import create_app

ROOT = Path(__file__).resolve().parents[1]


class ApiRegressionTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "DATABASE": str(Path(self.temp_dir.name) / "test.sqlite"),
                "SEED_FILE": str(ROOT / "transactions.json"),
            }
        )
        self.client = self.app.test_client()

    def register(self, email="test@example.com", phone="0977123456"):
        return self.client.post(
            "/api/auth/register",
            json={
                "name": "Test User",
                "phone": phone,
                "email": email,
                "password": "secret1",
            },
        )

    def login(self, email="test@example.com", password="secret1"):
        return self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )

    def test_frontend_pages_and_assets_are_served(self):
        for path in (
            "/",
            "/auth.html",
            "/api.js",
            "/style.css",
            "/dashboard.js",
            "/vendor/chart.umd.min.js",
        ):
            with self.subTest(path=path):
                with self.client.get(path) as response:
                    self.assertEqual(response.status_code, 200)

        with self.client.get("/transactions.json") as response:
            self.assertEqual(response.status_code, 404)
        with self.client.get("/app.py") as response:
            self.assertEqual(response.status_code, 404)

    def test_meta_is_public(self):
        response = self.client.get("/api/meta")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["nextId"], "WB0000309")
        self.assertEqual(len(data["booths"]), 6)
        self.assertEqual(len(data["services"]), 5)

    def test_protected_endpoints_require_login(self):
        for path in ("/api/auth/me", "/api/transactions", "/api/dashboard"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)

    def test_register_login_me_logout_flow(self):
        response = self.register()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["user"]["phone"], "+260977123456")

        response = self.login()
        self.assertEqual(response.status_code, 200)

        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["email"], "test@example.com")

        response = self.client.post("/api/auth/logout")
        self.assertEqual(response.status_code, 204)

        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_duplicate_email_is_rejected(self):
        self.assertEqual(self.register().status_code, 201)
        response = self.register(phone="0966123456")
        self.assertEqual(response.status_code, 409)
        self.assertIn("email", response.get_json()["error"].lower())

    def test_invalid_phone_is_rejected(self):
        response = self.register(phone="12345")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Zambian", response.get_json()["error"])

    def test_incorrect_password_is_rejected(self):
        self.register()
        response = self.login(password="wrong-password")
        self.assertEqual(response.status_code, 401)

    def test_dashboard_regression_numbers(self):
        self.register()
        self.login()

        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()

        self.assertEqual(data["summary"]["count"], 308)
        self.assertEqual(data["summary"]["totalRevenue"], 32033.69)
        self.assertEqual(data["summary"]["totalCapital"], 740000)
        self.assertEqual(data["summary"]["totalTax"], 89756.28)
        self.assertEqual(data["nextId"], "WB0000309")

        limits = {row["service"]: row for row in data["limits"]}
        self.assertEqual(limits["Airtel Money"]["remaining"], 32373.0)
        self.assertEqual(limits["MTN Money"]["remaining"], 21818.0)
        self.assertEqual(limits["Zamtel Money"]["remaining"], 5666.0)
        self.assertEqual(limits["Zanaco"]["remaining"], 28559.0)
        self.assertEqual(limits["FNB"]["remaining"], 851.0)
        self.assertEqual(limits["FNB"]["percentUsed"], 98.94)

    def test_create_transaction_uses_server_generated_id(self):
        self.register()
        self.login()

        response = self.client.post(
            "/api/transactions",
            json={"booth": "Wina1", "service": "Airtel Money", "amount": 100},
        )
        self.assertEqual(response.status_code, 201)
        body = response.get_json()["transaction"]
        self.assertEqual(body["id"], "WB0000309")
        self.assertEqual(body["nextId"], "WB0000310")
        self.assertEqual(body["rate"], 0.05)

        dashboard = self.client.get("/api/dashboard").get_json()
        self.assertEqual(dashboard["summary"]["count"], 309)
        self.assertEqual(dashboard["summary"]["totalRevenue"], 32038.69)
        self.assertEqual(dashboard["nextId"], "WB0000310")

    def test_transaction_service_must_be_offered_at_booth(self):
        self.register()
        self.login()

        response = self.client.post(
            "/api/transactions",
            json={"booth": "Wina4", "service": "Zanaco", "amount": 100},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("not offered", response.get_json()["error"])

    def test_transaction_over_limit_is_rejected(self):
        self.register()
        self.login()

        response = self.client.post(
            "/api/transactions",
            json={"booth": "Wina1", "service": "FNB", "amount": 1000},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()["remaining"], 851.0)
        self.assertEqual(response.get_json()["shortfall"], 149.0)

    def test_duplicate_transaction_is_allowed(self):
        self.register()
        self.login()

        first = self.client.post(
            "/api/transactions",
            json={"booth": "Wina1", "service": "Airtel Money", "amount": 100},
        )
        second = self.client.post(
            "/api/transactions",
            json={"booth": "Wina1", "service": "Airtel Money", "amount": 100},
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(first.get_json()["transaction"]["id"], "WB0000309")
        self.assertEqual(second.get_json()["transaction"]["id"], "WB0000310")

    def test_zero_or_negative_amount_is_rejected(self):
        self.register()
        self.login()

        response = self.client.post(
            "/api/transactions",
            json={"booth": "Wina1", "service": "Airtel Money", "amount": 0},
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
