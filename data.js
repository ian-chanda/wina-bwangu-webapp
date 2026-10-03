const booths = {
  wina1: "Lusaka CPD",
  wina2: "Libala",
  wina3: "Kabwata",
  wina4: "Mandevu",
  wina5: "Woodlands",
  wina6: "Matero East"
}

const services = {
  "Airtel Money": { rate: 0.05, limit: 350_000 },
  "MTN Money": { rate: 0.06, limit: 160_000 },
  "Zamtel Money": { rate: 0.045, limit: 70_000 },
  "Zanaco": { rate: 0.035, limit: 80_000 },
  "FNB": { rate: 0.04, limit: 80_000 }
}

const boothServices = {
  wina1: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
  wina2: ["Airtel Money", "MTN Money", "Zamtel Money", "FNB"],
  wina3: ["Airtel Money", "MTN Money", "Zamtel Money", "Zanaco", "FNB"],
  wina4: ["Airtel Money", "MTN Money", "Zamtel Money"],
  wina5: ["Airtel Money", "MTN Money", "Zanaco", "FNB"],
  wina6: ["Airtel Money", "MTN Money", "Zamtel Money"],
}

