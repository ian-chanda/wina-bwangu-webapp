"""Pure calculation functions.

These functions take plain transaction dictionaries so they can be unit-tested
without Flask, a database, or a browser.
"""

from .catalog import BOOTHS, BOOTH_SERVICES, SERVICES, VAT_RATE


def round_money(value):
    """Round to 2 decimal places, matching the existing JavaScript output."""
    return round(float(value), 2)


def calc_amount_and_tax(amount, tax_rate=VAT_RATE):
    """Split a VAT-inclusive amount into the net amount and the VAT portion."""
    amount = float(amount)
    amount_after_tax = amount / (1 + tax_rate)
    tax_amount = amount - amount_after_tax
    return {
        "amount": round_money(amount),
        "amountAfterTax": round_money(amount_after_tax),
        "taxAmount": round_money(tax_amount),
        "taxRate": tax_rate,
    }


def generate_transaction_id(transactions):
    """Return the next WB0000000-style ID."""
    highest = 0
    for transaction in transactions:
        try:
            number = int(str(transaction["id"])[2:])
        except (KeyError, TypeError, ValueError):
            continue
        highest = max(highest, number)
    return "WB" + str(highest + 1).zfill(7)


def get_revenue_per_booth(transactions):
    revenue = {booth: 0.0 for booth in BOOTHS}
    for transaction in transactions:
        booth = transaction.get("booth")
        if booth in revenue:
            revenue[booth] += float(transaction["amount"]) * float(transaction["rate"])
    return {booth: round_money(value) for booth, value in revenue.items()}


def get_service_frequency_per_booth(transactions):
    frequency = {booth: {} for booth in BOOTHS}
    for transaction in transactions:
        booth = transaction.get("booth")
        service = transaction.get("service")
        if booth not in frequency:
            continue
        frequency[booth][service] = frequency[booth].get(service, 0) + 1
    return frequency


def get_grand_totals(transactions):
    total_revenue = 0.0
    for transaction in transactions:
        total_revenue += float(transaction["amount"]) * float(transaction["rate"])
    total_capital = sum(service["limit"] for service in SERVICES.values())
    return {
        "totalRevenue": round_money(total_revenue),
        "totalCapital": total_capital,
    }


def get_service_limit_status(transactions):
    status = {
        service: {
            "total": 0.0,
            "limit": details["limit"],
            "remaining": details["limit"],
            "percentUsed": 0.0,
            "overLimit": False,
        }
        for service, details in SERVICES.items()
    }

    for transaction in transactions:
        service = transaction.get("service")
        if service in status:
            status[service]["total"] += float(transaction["amount"])

    for item in status.values():
        item["total"] = round_money(item["total"])
        item["remaining"] = round_money(item["limit"] - item["total"])
        item["percentUsed"] = round_money((item["total"] / item["limit"]) * 100)
        item["overLimit"] = item["remaining"] < 0

    return status


def can_accept_transaction(transactions, service, amount):
    status = get_service_limit_status(transactions).get(service)
    amount = float(amount)

    if not status:
        return {"allowed": False, "reason": "Unknown service"}
    if amount <= 0:
        return {"allowed": False, "reason": "Amount must be greater than zero"}
    if status["remaining"] < amount:
        return {
            "allowed": False,
            "reason": "Monthly limit exceeded",
            "remaining": status["remaining"],
            "shortfall": round_money(amount - status["remaining"]),
        }

    return {
        "allowed": True,
        "remaining": round_money(status["remaining"] - amount),
    }


def build_dashboard(transactions):
    """Build every number the dashboard needs in one server response."""
    totals = get_grand_totals(transactions)
    revenue = get_revenue_per_booth(transactions)
    frequency = get_service_frequency_per_booth(transactions)
    limits = get_service_limit_status(transactions)

    total_tax = 0.0
    booth_info = {
        booth: {"count": 0, "amount": 0.0, "tax": 0.0} for booth in BOOTHS
    }
    for transaction in transactions:
        booth = transaction.get("booth")
        if booth not in booth_info:
            continue
        amount = float(transaction["amount"])
        booth_info[booth]["count"] += 1
        booth_info[booth]["amount"] += amount
        booth_info[booth]["tax"] += calc_amount_and_tax(amount)["taxAmount"]

    # Recalculate tax from raw amounts so the share is based on exact values.
    for transaction in transactions:
        booth = transaction.get("booth")
        if booth in booth_info:
            total_tax += float(transaction["amount"]) - float(transaction["amount"]) / (1 + VAT_RATE)

    booths = []
    for booth, location in BOOTHS.items():
        info = booth_info[booth]
        tax = round_money(info["tax"])
        share = round_money((info["tax"] / total_tax) * 100) if total_tax else 0.0
        booths.append(
            {
                "id": booth,
                "location": location,
                "count": info["count"],
                "amount": round_money(info["amount"]),
                "revenue": revenue[booth],
                "tax": tax,
                "vatShare": share,
            }
        )

    limit_rows = [
        {
            "service": service,
            "limit": details["limit"],
            "total": details["total"],
            "remaining": details["remaining"],
            "percentUsed": details["percentUsed"],
            "overLimit": details["overLimit"],
        }
        for service, details in limits.items()
    ]

    return {
        "summary": {
            "count": len(transactions),
            "totalRevenue": totals["totalRevenue"],
            "totalCapital": totals["totalCapital"],
            "totalTax": round_money(total_tax),
        },
        "limits": limit_rows,
        "booths": booths,
        "frequency": frequency,
        "serviceNames": list(SERVICES),
        "boothServices": BOOTH_SERVICES,
        "charts": {
            "totals": {
                "labels": ["Total revenue", "Total capital"],
                "data": [totals["totalRevenue"], totals["totalCapital"]],
            },
            "booths": {
                "labels": [
                    booth + " (" + location + ")" for booth, location in BOOTHS.items()
                ],
                "data": [revenue[booth] for booth in BOOTHS],
            },
        },
        "nextId": generate_transaction_id(transactions),
    }
