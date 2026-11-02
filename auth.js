const REDIRECT_AFTER_LOGIN = "/";

const signUpButton = document.getElementById("signUp");
const signInButton = document.getElementById("signIn");
const container = document.getElementById("container");

function showSignUp() {
  container.classList.add("right-panel-active");
}

function showSignIn() {
  container.classList.remove("right-panel-active");
}

signUpButton.addEventListener("click", showSignUp);
signInButton.addEventListener("click", showSignIn);
document.getElementById("mobileToSignIn").addEventListener("click", (event) => {
  event.preventDefault();
  showSignIn();
});
document.getElementById("mobileToSignUp").addEventListener("click", (event) => {
  event.preventDefault();
  showSignUp();
});

function normalisePhone(raw) {
  const cleaned = String(raw || "").replace(/[\s-]/g, "");
  const match = cleaned.match(/^(?:\+260|260|0)?((?:9|7)[567]\d{7})$/);
  return match ? "+260" + match[1] : null;
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + (type || "");
}

function markInvalid(...inputs) {
  inputs.forEach((input) => input.classList.add("invalid"));
}

function clearInvalid(form) {
  form.querySelectorAll("input").forEach((input) => input.classList.remove("invalid"));
}

document.getElementById("signUpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  clearInvalid(form);

  const nameEl = document.getElementById("suName");
  const phoneEl = document.getElementById("suPhone");
  const emailEl = document.getElementById("suEmail");
  const passEl = document.getElementById("suPassword");
  const confirmEl = document.getElementById("suConfirm");
  const msg = document.getElementById("suMessage");

  const name = nameEl.value.trim();
  const phone = normalisePhone(phoneEl.value);
  const email = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  if (name.length < 2) {
    markInvalid(nameEl);
    return setMessage(msg, "Please enter your full name.", "error");
  }
  if (!phone) {
    markInvalid(phoneEl);
    return setMessage(msg, "Enter a valid Zambian number, e.g. 0977123456.", "error");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInvalid(emailEl);
    return setMessage(msg, "Enter a valid email address.", "error");
  }
  if (password.length < 6) {
    markInvalid(passEl);
    return setMessage(msg, "Password must be at least 6 characters.", "error");
  }
  if (password !== confirmEl.value) {
    markInvalid(confirmEl);
    return setMessage(msg, "Passwords do not match.", "error");
  }

  try {
    await WB.register({ name, phone, email, password });
    form.reset();
    setMessage(msg, "", "");
    document.getElementById("siEmail").value = email;
    setMessage(document.getElementById("siMessage"), "Account created! Please sign in.", "success");
    showSignIn();
  } catch (error) {
    markInvalid(emailEl);
    setMessage(msg, error.message, "error");
  }
});

document.getElementById("signInForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  clearInvalid(form);

  const emailEl = document.getElementById("siEmail");
  const passEl = document.getElementById("siPassword");
  const msg = document.getElementById("siMessage");

  const email = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  if (!email || !password) {
    markInvalid(emailEl, passEl);
    return setMessage(msg, "Enter your email and password.", "error");
  }

  try {
    const response = await WB.login({ email, password });
    setMessage(msg, "Welcome, " + response.user.name + "!", "success");
    setTimeout(() => { window.location.replace(REDIRECT_AFTER_LOGIN); }, 600);
  } catch (error) {
    markInvalid(emailEl, passEl);
    setMessage(msg, error.message, "error");
  }
});

WB.me()
  .then(() => { window.location.replace(REDIRECT_AFTER_LOGIN); })
  .catch(() => {});
