// Role 6: Dashboard.
// Reads the `transactions` array and uses the functions in app.js
// (getServiceLimitStatus, getRevenuePerBooth, getServiceFrequencyPerBooth,
// getGrandTotals, calcAmountAndTax) to fill in the dashboard section.
// forms.js calls refreshDashboard() after a new transaction is saved.

const dashMoney = n => 'K' + Number(n).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let totalsPie = null;
let boothPie = null;

// builds a little data bar. percent is 0-100, text is what is written under it
function dataBar(percent, text, colourClass) {
  const width = Math.max(0, Math.min(100, percent));
  return '<div class="bar"><div class="bar-fill ' + (colourClass || '') + '" style="width:' + width + '%"></div></div>' +
         '<span class="bar-text">' + text + '</span>';
}

// ---------- headline cards ----------
function drawSummary() {
  const totals = getGrandTotals(transactions);

  let tax = 0;
  for (let i = 0; i < transactions.length; i++) {
    tax += calcAmountAndTax(transactions[i].amount).taxAmount;
  }

  document.getElementById('sumCount').textContent = transactions.length;
  document.getElementById('sumRevenue').textContent = dashMoney(totals.totalRevenue);
  document.getElementById('sumCapital').textContent = dashMoney(totals.totalCapital);
  document.getElementById('sumTax').textContent = dashMoney(tax);
}

// ---------- service limits table ----------
function drawLimits() {
  const status = getServiceLimitStatus(transactions);
  const body = document.querySelector('#limitTable tbody');
  let rows = '';

  for (const service in status) {
    const s = status[service];
    let colour = '';
    if (s.percentUsed >= 100) colour = 'danger';
    else if (s.percentUsed >= 80) colour = 'warn';

    rows += '<tr>' +
      '<td>' + service + '</td>' +
      '<td>' + dashMoney(s.limit) + '</td>' +
      '<td>' + dashMoney(s.total) + '</td>' +
      '<td class="' + (s.remaining < 0 ? 'neg' : '') + '">' + dashMoney(s.remaining) + '</td>' +
      '<td class="bar-cell">' + dataBar(s.percentUsed, s.percentUsed.toFixed(1) + '% used', colour) + '</td>' +
      '</tr>';
  }
  body.innerHTML = rows;
}

// the little "can this go through?" box for agents
function fillCheckDropdown() {
  const select = document.getElementById('checkService');
  if (select.options.length > 0) return;
  for (const service in services) {
    const o = document.createElement('option');
    o.value = service;
    o.textContent = service;
    select.appendChild(o);
  }
}

function runCreditCheck() {
  const service = document.getElementById('checkService').value;
  const amount = Number(document.getElementById('checkAmount').value);
  const out = document.getElementById('checkResult');
  const result = canAcceptTransaction(transactions, service, amount);

  if (result.allowed) {
    out.className = 'ok';
    out.textContent = 'Yes, go ahead. ' + dashMoney(result.remaining) + ' would be left.';
  } else {
    out.className = 'bad';
    let msg = 'No: ' + result.reason + '.';
    if (result.shortfall) msg += ' Short by ' + dashMoney(result.shortfall) + '.';
    out.textContent = msg;
  }
}

// ---------- booth table (revenue + tax bars) ----------
function drawBooths() {
  const revenue = getRevenuePerBooth(transactions);
  const body = document.querySelector('#boothTable tbody');

  // work out count, amount and VAT for each booth
  const info = {};
  for (const id in booths) {
    info[id] = { count: 0, amount: 0, tax: 0 };
  }
  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    if (!info[t.booth]) continue;
    info[t.booth].count++;
    info[t.booth].amount += t.amount;
    info[t.booth].tax += calcAmountAndTax(t.amount).taxAmount;
  }

  let totalTax = 0;
  for (const id in info) totalTax += info[id].tax;

  let rows = '';
  for (const id in booths) {
    const b = info[id];
    const share = totalTax > 0 ? (b.tax / totalTax) * 100 : 0;
    rows += '<tr>' +
      '<td>' + id + '</td>' +
      '<td>' + booths[id] + '</td>' +
      '<td>' + b.count + '</td>' +
      '<td>' + dashMoney(b.amount) + '</td>' +
      '<td>' + dashMoney(revenue[id] || 0) + '</td>' +
      '<td>' + dashMoney(b.tax) + '</td>' +
      '<td class="bar-cell">' + dataBar(share, share.toFixed(1) + '% of all VAT') + '</td>' +
      '</tr>';
  }
  body.innerHTML = rows;
}

// ---------- frequency table: booths down the side, services across ----------
function drawFrequency() {
  const freq = getServiceFrequencyPerBooth(transactions);
  const serviceNames = Object.keys(services);

  let head = '<tr><th>Booth</th>';
  serviceNames.forEach(s => { head += '<th>' + s + '</th>'; });
  head += '<th>Total</th></tr>';
  document.querySelector('#freqTable thead').innerHTML = head;

  let rows = '';
  for (const id in booths) {
    let rowTotal = 0;
    let cells = '';
    serviceNames.forEach(s => {
      const offered = boothServices[id].includes(s);
      const n = (freq[id] && freq[id][s]) || 0;
      rowTotal += n;
      cells += '<td>' + (offered ? n : '<span style="color:#aaa">n/a</span>') + '</td>';
    });
    rows += '<tr><td>' + id + ' (' + booths[id] + ')</td>' + cells + '<td><strong>' + rowTotal + '</strong></td></tr>';
  }
  document.querySelector('#freqTable tbody').innerHTML = rows;
}

// ---------- pie charts ----------
function drawPies() {
  // Chart.js comes from a CDN, so skip quietly if we are offline
  if (typeof Chart === 'undefined') return;

  const totals = getGrandTotals(transactions);
  const revenue = getRevenuePerBooth(transactions);
  const colours = ['#2b6cb0', '#ed8936', '#38a169', '#805ad5', '#d53f8c', '#319795'];

  if (totalsPie) totalsPie.destroy();
  if (boothPie) boothPie.destroy();

  totalsPie = new Chart(document.getElementById('pieTotals'), {
    type: 'pie',
    data: {
      labels: ['Total revenue', 'Total capital'],
      datasets: [{ data: [totals.totalRevenue, totals.totalCapital], backgroundColor: ['#ed8936', '#2b6cb0'] }]
    },
    options: {
      plugins: {
        tooltip: { callbacks: { label: c => c.label + ': ' + dashMoney(c.parsed) } }
      }
    }
  });

  const boothIds = Object.keys(booths);
  boothPie = new Chart(document.getElementById('pieBooths'), {
    type: 'pie',
    data: {
      labels: boothIds.map(id => id + ' (' + booths[id] + ')'),
      datasets: [{ data: boothIds.map(id => revenue[id] || 0), backgroundColor: colours }]
    },
    options: {
      plugins: {
        tooltip: { callbacks: { label: c => c.label + ': ' + dashMoney(c.parsed) } }
      }
    }
  });
}

// draws everything. forms.js calls this after saving a transaction
function refreshDashboard() {
  drawSummary();
  drawLimits();
  drawBooths();
  drawFrequency();
  drawPies();
}

fillCheckDropdown();
document.getElementById('checkBtn').addEventListener('click', runCreditCheck);
// redraw when the dashboard tab is opened so the charts size themselves properly
document.getElementById('nav-dashboard').addEventListener('click', refreshDashboard);
refreshDashboard();
