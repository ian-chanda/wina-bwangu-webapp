// grabs the buttons and the sections 
const recordBtn = document.getElementById("nav-record");
const dashBtn = document.getElementById("nav-dashboard");
const recordSec = document.getElementById("record-transaction");
const dashSec = document.getElementById("dashboard");

// functions that switch the sections 
function showRecord() {
  recordSec.classList.remove("hidden");
  dashSec.classList.add("hidden");
}


function showDashboard() {
  dashSec.classList.remove("hidden");
  recordSec.classList.add("hidden");
}

// button adding function to the html elements 
recordBtn.addEventListener("click", showRecord);
dashBtn.addEventListener("click", showDashboard);

// VAT rate. The case study leaves this open, so it lives in ONE place.
const VAT_RATE = 0.16;

// makes the next transaction id
function generateTransactionId(transactions) {
  let highest = 0;

  for (let i = 0; i < transactions.length; i++) {
    const number = Number(transactions[i].id.slice(2));
    if (number > highest) {
      highest = number;
    }
  }

  const next = String(highest + 1).padStart(7, "0");
  return "WB" + next;
}

// adds up the revenue of each booth (amount x rate)
function getRevenuePerBooth(transactions) {
  const revenue = {};

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!revenue[t.booth]) {
      revenue[t.booth] = 0;
    }
    revenue[t.booth] += t.amount * t.rate;
  }

  // round to 2 decimal places
  for (const booth in revenue) {
    revenue[booth] = Number(revenue[booth].toFixed(2));
  }

  return revenue;
}

// counts how many times each service was used at each booth
function getServiceFrequencyPerBooth(transactions) {
  const frequency = {};

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!frequency[t.booth]) {
      frequency[t.booth] = {};
    }
    if (!frequency[t.booth][t.service]) {
      frequency[t.booth][t.service] = 0;
    }
    frequency[t.booth][t.service]++;
  }

  return frequency;
}

// total revenue and total capital for the whole company
function getGrandTotals(transactions) {
  let totalRevenue = 0;
  for (let i = 0; i < transactions.length; i++) {
    totalRevenue += transactions[i].amount * transactions[i].rate;
  }

  // capital = the credit needed for a month (all the monthly limits added up)
  let totalCapital = 0;
  for (const service in services) {
    totalCapital += services[service].limit;
  }

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCapital: totalCapital
  };
}

// looks up a booth's location
function getBoothLocation(boothID) {
  return booths[boothID];
}

// returns only the services a booth offers
function getBoothServices(boothID) {
  return boothServices[boothID];
}

// splits a VAT-inclusive amount into the tax-free part and the VAT part.
// amount is what the customer actually hands over, taxRate defaults to 16%.
function calcAmountAndTax(amount, taxRate = VAT_RATE) {
  const amountAfterTax = amount / (1 + taxRate);
  const taxAmount = amount - amountAfterTax;

  return {
    amount: Number(amount.toFixed(2)),
    amountAfterTax: Number(amountAfterTax.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    taxRate: taxRate
  };
}

// for each service: how much float has been used this month, how much of the
// monthly limit is left, and whether a new transaction would breach the limit.
// the limit is measured against transaction AMOUNT, not revenue.
function getServiceLimitStatus(transactions) {
  const status = {};

  for (const service in services) {
    status[service] = {
      total: 0,
      limit: services[service].limit,
      remaining: services[service].limit,
      percentUsed: 0,
      overLimit: false
    };
  }

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!status[t.service]) {
      continue;
    }
    status[t.service].total += t.amount;
  }

  for (const service in status) {
    const s = status[service];
    s.total = Number(s.total.toFixed(2));
    s.remaining = Number((s.limit - s.total).toFixed(2));
    s.percentUsed = Number(((s.total / s.limit) * 100).toFixed(2));
    s.overLimit = s.remaining < 0;
  }

  return status;
}

// used by the agent credit check: is there room in the limit for this amount?
function canAcceptTransaction(transactions, service, amount) {
  const s = getServiceLimitStatus(transactions)[service];

  if (!s) {
    return { allowed: false, reason: "Unknown service" };
  }
  if (amount <= 0) {
    return { allowed: false, reason: "Amount must be greater than zero" };
  }
  if (s.remaining < amount) {
    return {
      allowed: false,
      reason: "Monthly limit exceeded",
      remaining: s.remaining,
      shortfall: Number((amount - s.remaining).toFixed(2))
    };
  }

  return { allowed: true, remaining: Number((s.remaining - amount).toFixed(2)) };
}
