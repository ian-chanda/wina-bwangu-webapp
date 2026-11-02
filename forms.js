(async () => {
  const $ = (id) => document.getElementById(id);
  const form = $("transactionForm");
  const boothSelect = $("boothSelect");
  const locationDisplay = $("locationDisplay");
  const serviceSelect = $("serviceSelect");
  const rateDisplay = $("rateDisplay");
  const amountInput = $("amountInput");
  const afterTaxDisplay = $("afterTaxDisplay");
  const idDisplay = $("idDisplay");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  let meta = null;

  function setNextId(nextId) {
    if (idDisplay) idDisplay.value = nextId || "";
  }

  function fillBooths() {
    Object.keys(meta.booths).forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = id + " — " + meta.booths[id];
      boothSelect.appendChild(option);
    });
  }

  function resetServiceDropdown(placeholder) {
    serviceSelect.innerHTML = '<option value="">' + placeholder + "</option>";
    rateDisplay.value = "";
  }

  function fillServices(booth) {
    serviceSelect.disabled = false;
    resetServiceDropdown("Select service");
    (meta.boothServices[booth] || []).forEach((service) => {
      const option = document.createElement("option");
      option.value = service;
      option.textContent = service;
      serviceSelect.appendChild(option);
    });
  }

  function updateAfterTax() {
    const amount = Number(amountInput.value);
    if (!(amount > 0)) {
      afterTaxDisplay.value = "";
      return;
    }
    const { amountAfterTax, taxAmount, taxRate } = calcAmountAndTax(amount);
    afterTaxDisplay.value =
      formatMoney(amountAfterTax) +
      " (VAT " +
      (taxRate * 100).toFixed(0) +
      "%: " +
      formatMoney(taxAmount) +
      ")";
  }

  function resetForm() {
    form.reset();
    boothSelect.dispatchEvent(new Event("change"));
    afterTaxDisplay.value = "";
  }

  boothSelect.addEventListener("change", () => {
    const booth = boothSelect.value;
    updateAfterTax();

    if (!booth) {
      locationDisplay.value = "";
      serviceSelect.disabled = true;
      resetServiceDropdown("Select booth first");
      return;
    }

    locationDisplay.value = meta.booths[booth];
    fillServices(booth);
  });

  serviceSelect.addEventListener("change", () => {
    const service = serviceSelect.value;
    rateDisplay.value = service ? meta.services[service].rate : "";
    updateAfterTax();
  });

  amountInput.addEventListener("input", updateAfterTax);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const booth = boothSelect.value;
    const service = serviceSelect.value;
    const amount = Number(amountInput.value);
    const error = validateTransaction({ booth, service, amount });

    if (error) {
      showToast(error, "error");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await WB.createTransaction({ booth, service, amount });
      showToast("Transaction saved successfully!", "success");
      resetForm();
      setNextId(response.transaction.nextId);
      if (typeof refreshDashboard === "function") refreshDashboard();
    } catch (err) {
      showToast(err.message, "error");
      if (err.message === "Authentication required") {
        window.location.replace("/auth.html");
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  $("clearBtn").addEventListener("click", resetForm);

  try {
    meta = await WB.meta();
    fillBooths();
    resetServiceDropdown("Select booth first");
    setNextId(meta.nextId);
  } catch (err) {
    showToast("Could not load app data. Is the server running?", "error");
  }
})();
