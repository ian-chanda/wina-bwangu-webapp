let totalsPie = null;
let boothPie = null;

function dataBar(percent, text, colourClass) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    '<div class="bar"><div class="bar-fill ' +
    (colourClass || "") +
    '" style="width:' +
    width +
    '%"></div></div>' +
    '<span class="bar-text">' +
    text +
    "</span>"
  );
}

function drawSummary(summary) {
  document.getElementById("sumCount").textContent = summary.count;
  document.getElementById("sumRevenue").textContent = formatMoney(summary.totalRevenue);
  document.getElementById("sumCapital").textContent = formatMoney(summary.totalCapital);
  document.getElementById("sumTax").textContent = formatMoney(summary.totalTax);
}

function drawLimits(limits) {
  const body = document.querySelector("#limitTable tbody");
  let rows = "";

  limits.forEach((item) => {
    let colour = "";
    if (item.percentUsed >= 100) colour = "danger";
    else if (item.percentUsed >= 80) colour = "warn";

    rows +=
      "<tr>" +
      "<td>" + item.service + "</td>" +
      "<td>" + formatMoney(item.limit) + "</td>" +
      "<td>" + formatMoney(item.total) + "</td>" +
      '<td class="' + (item.remaining < 0 ? "neg" : "") + '">' + formatMoney(item.remaining) + "</td>" +
      '<td class="bar-cell">' + dataBar(item.percentUsed, item.percentUsed.toFixed(1) + "% used", colour) + "</td>" +
      "</tr>";
  });

  body.innerHTML = rows;
}

function drawBooths(booths) {
  const body = document.querySelector("#boothTable tbody");
  let rows = "";

  booths.forEach((booth) => {
    rows +=
      "<tr>" +
      "<td>" + booth.id + "</td>" +
      "<td>" + booth.location + "</td>" +
      "<td>" + booth.count + "</td>" +
      "<td>" + formatMoney(booth.amount) + "</td>" +
      "<td>" + formatMoney(booth.revenue) + "</td>" +
      "<td>" + formatMoney(booth.tax) + "</td>" +
      '<td class="bar-cell">' + dataBar(booth.vatShare, booth.vatShare.toFixed(1) + "% of all VAT") + "</td>" +
      "</tr>";
  });

  body.innerHTML = rows;
}

function drawFrequency(frequency, serviceNames, boothServices, booths) {
  let head = "<tr><th>Booth</th>";
  serviceNames.forEach((service) => { head += "<th>" + service + "</th>"; });
  head += "<th>Total</th></tr>";
  document.querySelector("#freqTable thead").innerHTML = head;

  let rows = "";
  booths.forEach((booth) => {
    let rowTotal = 0;
    let cells = "";

    serviceNames.forEach((service) => {
      const offered = (boothServices[booth.id] || []).includes(service);
      const count = (frequency[booth.id] && frequency[booth.id][service]) || 0;
      rowTotal += count;
      cells += "<td>" + (offered ? count : '<span style="color:#aaa">n/a</span>') + "</td>";
    });

    rows +=
      "<tr><td>" + booth.id + " (" + booth.location + ")</td>" +
      cells +
      "<td><strong>" + rowTotal + "</strong></td></tr>";
  });

  document.querySelector("#freqTable tbody").innerHTML = rows;
}

function drawPies(charts) {
  if (typeof Chart === "undefined") return;

  const colours = ["#2b6cb0", "#ed8936", "#38a169", "#805ad5", "#d53f8c", "#319795"];

  if (totalsPie) totalsPie.destroy();
  if (boothPie) boothPie.destroy();

  totalsPie = new Chart(document.getElementById("pieTotals"), {
    type: "pie",
    data: {
      labels: charts.totals.labels,
      datasets: [{
        data: charts.totals.data,
        backgroundColor: ["#ed8936", "#2b6cb0"],
      }],
    },
    options: {
      plugins: {
        tooltip: { callbacks: { label: (context) => context.label + ": " + formatMoney(context.parsed) } },
      },
    },
  });

  boothPie = new Chart(document.getElementById("pieBooths"), {
    type: "pie",
    data: {
      labels: charts.booths.labels,
      datasets: [{ data: charts.booths.data, backgroundColor: colours }],
    },
    options: {
      plugins: {
        tooltip: { callbacks: { label: (context) => context.label + ": " + formatMoney(context.parsed) } },
      },
    },
  });
}

function renderDashboard(data) {
  drawSummary(data.summary);
  drawLimits(data.limits);
  drawBooths(data.booths);
  drawFrequency(data.frequency, data.serviceNames, data.boothServices, data.booths);
  drawPies(data.charts);
}

async function refreshDashboard() {
  try {
    const data = await WB.dashboard();
    renderDashboard(data);
  } catch (err) {
    if (err.message === "Authentication required") {
      window.location.replace("/auth.html");
      return;
    }
    if (typeof showToast === "function") {
      showToast("Could not load dashboard: " + err.message, "error");
    }
  }
}

document.getElementById("nav-dashboard").addEventListener("click", refreshDashboard);
document.addEventListener("transaction:added", refreshDashboard);
refreshDashboard();
