import json
import unittest
from pathlib import Path

from wina.catalog import BOOTHS, SERVICES
from wina.services import (
    build_dashboard,
    calc_amount_and_tax,
    can_accept_transaction,
    generate_transaction_id,
    get_grand_totals,
    get_revenue_per_booth,
    get_service_frequency_per_booth,
    get_service_limit_status,
)

ROOT = Path(__file__).resolve().parents[1]
TRANSACTIONS = json.loads((ROOT / "transactions.json").read_text(encoding="utf-8"))


class CalculationUnitTests(unittest.TestCase):
    def test_seed_has_308_transactions(self):
        self.assertEqual(len(TRANSACTIONS), 308)

    def test_calc_amount_and_tax_splits_vat(self):
        result = calc_amount_and_tax(964)
        self.assertEqual(result["amount"], 964)
        self.assertEqual(result["amountAfterTax"], 831.03)
        self.assertEqual(result["taxAmount"], 132.97)
        self.assertEqual(result["taxRate"], 0.16)

    def test_next_transaction_id(self):
        self.assertEqual(generate_transaction_id(TRANSACTIONS), "WB0000309")

    def test_grand_totals_match_known_values(self):
        totals = get_grand_totals(TRANSACTIONS)
        self.assertEqual(totals["totalRevenue"], 32033.69)
        self.assertEqual(totals["totalCapital"], 740000)

    def test_revenue_per_booth(self):
        revenue = get_revenue_per_booth(TRANSACTIONS)
        self.assertEqual(
            revenue,
            {
                "Wina1": 2556.4,
                "Wina2": 5675.62,
                "Wina3": 13448.16,
                "Wina4": 5693.23,
                "Wina5": 2530.99,
                "Wina6": 2129.3,
            },
        )
        self.assertEqual(round(sum(revenue.values()), 2), 32033.7)

    def test_service_frequency_totals_all_transactions(self):
        frequency = get_service_frequency_per_booth(TRANSACTIONS)
        total = sum(sum(services.values()) for services in frequency.values())
        self.assertEqual(total, 308)
        self.assertEqual(sum(frequency["Wina1"].values()), 26)

    def test_service_limit_status_known_values(self):
        status = get_service_limit_status(TRANSACTIONS)
        self.assertEqual(status["Airtel Money"]["remaining"], 32373.0)
        self.assertEqual(status["MTN Money"]["remaining"], 21818.0)
        self.assertEqual(status["Zamtel Money"]["remaining"], 5666.0)
        self.assertEqual(status["Zanaco"]["remaining"], 28559.0)
        self.assertEqual(status["FNB"]["remaining"], 851.0)
        self.assertEqual(status["FNB"]["percentUsed"], 98.94)

    def test_can_accept_transaction_within_limit(self):
        result = can_accept_transaction(TRANSACTIONS, "FNB", 500)
        self.assertTrue(result["allowed"])
        self.assertEqual(result["remaining"], 351.0)

    def test_can_reject_transaction_over_limit(self):
        result = can_accept_transaction(TRANSACTIONS, "FNB", 1000)
        self.assertFalse(result["allowed"])
        self.assertEqual(result["reason"], "Monthly limit exceeded")
        self.assertEqual(result["remaining"], 851.0)
        self.assertEqual(result["shortfall"], 149.0)

    def test_build_dashboard_contains_every_section(self):
        dashboard = build_dashboard(TRANSACTIONS)
        self.assertEqual(dashboard["summary"]["count"], 308)
        self.assertEqual(dashboard["summary"]["totalRevenue"], 32033.69)
        self.assertEqual(dashboard["summary"]["totalCapital"], 740000)
        self.assertEqual(dashboard["nextId"], "WB0000309")
        self.assertEqual(len(dashboard["limits"]), len(SERVICES))
        self.assertEqual(len(dashboard["booths"]), len(BOOTHS))
        self.assertEqual(len(dashboard["charts"]["totals"]["data"]), 2)
        self.assertEqual(len(dashboard["charts"]["booths"]["data"]), 6)


if __name__ == "__main__":
    unittest.main()
