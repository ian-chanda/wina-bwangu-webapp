const recordBtn = document.getElementById("nav-record");
const dashBtn = document.getElementById("nav-dashboard");
const recordSec = document.getElementById("record-transaction");
const dashSec = document.getElementById("dashboard");

function showRecord() {
  recordSec.classList.remove("hidden");
  dashSec.classList.add("hidden");
}

function showDashboard() {
  dashSec.classList.remove("hidden");
  recordSec.classList.add("hidden");
}

if (recordBtn && dashBtn && recordSec && dashSec) {
  recordBtn.addEventListener("click", showRecord);
  dashBtn.addEventListener("click", showDashboard);
}

const VAT_RATE = 0.16;

function calcAmountAndTax(amount, taxRate = VAT_RATE) {
  const amountAfterTax = amount / (1 + taxRate);
  const taxAmount = amount - amountAfterTax;

  return {
    amount: Number(amount.toFixed(2)),
    amountAfterTax: Number(amountAfterTax.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    taxRate: taxRate,
  };
}

function formatMoney(value) {
  return "K" + Number(value).toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
