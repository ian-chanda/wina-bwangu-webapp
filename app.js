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

// monthly limits for each service
const monthlyLimits = {
  "Airtel Money": 350000,
  "MTN Money": 160000,
  "Zamtel Money": 70000,
  "Zanaco": 80000,
  "FNB": 80000
};

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
  for (const service in monthlyLimits) {
    totalCapital += monthlyLimits[service];
  }

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCapital: totalCapital
  };
}
