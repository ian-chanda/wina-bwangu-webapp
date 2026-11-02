function showToast(message, type = "success") {
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function validateTransaction({ booth, service, amount }) {
  if (!booth) return "Please select a booth.";
  if (!service) return "Please select a service.";
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Please enter a valid transaction amount.";
  }
  return "";
}
