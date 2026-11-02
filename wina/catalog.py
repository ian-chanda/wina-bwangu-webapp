"""Static reference data for the Wina Bwangu app."""

BOOTHS = {
    "Wina1": "Lusaka CPD",
    "Wina2": "Libala",
    "Wina3": "Kabwata",
    "Wina4": "Mandevu",
    "Wina5": "Woodlands",
    "Wina6": "Matero East",
}

SERVICES = {
    "Airtel Money": {"rate": 0.05, "limit": 350_000},
    "MTN Money": {"rate": 0.06, "limit": 160_000},
    "Zamtel Money": {"rate": 0.045, "limit": 70_000},
    "Zanaco": {"rate": 0.035, "limit": 80_000},
    "FNB": {"rate": 0.04, "limit": 80_000},
}

BOOTH_SERVICES = {
    "Wina1": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina2": ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"],
    "Wina3": ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
    "Wina4": ["Airtel Money", "MTN Money", "Zamtel Money"],
    "Wina5": ["Airtel Money", "MTN Money", "Zanaco", "FNB"],
    "Wina6": ["Airtel Money", "MTN Money", "Zamtel Money"],
}

VAT_RATE = 0.16
