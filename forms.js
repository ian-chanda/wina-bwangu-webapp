// Role 4: Forms & Input UI.
// Scope: booth dropdown -> location auto-fill, service dropdown (filtered to
// that booth) -> rate auto-fill, and TransactionID auto-generation on submit.
// Validation/feedback (Role 5) and the dashboard refresh (Role 6) are not
// implemented here -- this just pushes the new record and leaves hooks for them.
(() => {
  const $ = id => document.getElementById(id);
  const form = $('transactionForm'),
        boothSelect = $('boothSelect'), locationDisplay = $('locationDisplay'),
        serviceSelect = $('serviceSelect'), rateDisplay = $('rateDisplay'),
        amountInput = $('amountInput'), afterTaxDisplay = $('afterTaxDisplay'),
        idDisplay = $('idDisplay');

  const money = n => 'K' + Number(n).toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const showNextId = () => { idDisplay.value = generateTransactionId(transactions); };

  // ---- Booth dropdown, built from data.js's `booths` ----
  function fillBooths() {
    Object.keys(booths).forEach(id => {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = `${id} — ${booths[id]}`;
      boothSelect.appendChild(o);
    });
  }

  function resetServiceDropdown(placeholder) {
    serviceSelect.innerHTML = `<option value="">${placeholder}</option>`;
    rateDisplay.value = '';
  }

  boothSelect.addEventListener('change', () => {
    const boothID = boothSelect.value;
    updateAfterTax();
    if (!boothID) {
      locationDisplay.value = '';
      serviceSelect.disabled = true;
      resetServiceDropdown('Select booth first');
      return;
    }
    locationDisplay.value = getBoothLocation(boothID);
    serviceSelect.disabled = false;
    resetServiceDropdown('Select service');
    getBoothServices(boothID).forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      serviceSelect.appendChild(o);
    });
  });

  serviceSelect.addEventListener('change', () => {
    const service = serviceSelect.value;
    rateDisplay.value = service ? services[service].rate : '';
    updateAfterTax();
  });

  // ---- Tax preview, via app.js's calcAmountAndTax ----
  function updateAfterTax() {
    const amount = Number(amountInput.value);
    if (!(amount > 0)) { afterTaxDisplay.value = ''; return; }
    const { amountAfterTax, taxAmount, taxRate } = calcAmountAndTax(amount);
    afterTaxDisplay.value = `${money(amountAfterTax)} (VAT ${(taxRate * 100).toFixed(0)}%: ${money(taxAmount)})`;
  }
  amountInput.addEventListener('input', updateAfterTax);

  // ---- Submit: relies on the form's own `required` attributes for now.
  // Role 5 layers real validation (required-field messages, duplicate checks,
  // the monthly-limit credit check) on top of this. ----
  form.addEventListener('submit', ev => {
    ev.preventDefault();

    const record = {
      id: generateTransactionId(transactions),
      booth: boothSelect.value,
      location: getBoothLocation(boothSelect.value),
      service: serviceSelect.value,
      rate: services[serviceSelect.value].rate,
      amount: Number(amountInput.value)
    };
    transactions.push(record);

    document.dispatchEvent(new CustomEvent('transaction:added', { detail: record })); // hook for Role 6's dashboard
    if (typeof refreshDashboard === 'function') refreshDashboard();

    resetForm();
  });

  function resetForm() {
    form.reset();
    boothSelect.dispatchEvent(new Event('change'));
    afterTaxDisplay.value = '';
    showNextId();
  }
  $('clearBtn').addEventListener('click', resetForm);

  fillBooths();
  showNextId();
})();
