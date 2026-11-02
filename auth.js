// ---------- Config ----------
const USERS_KEY = 'wb_users';          // all registered users (client-side prototype only)
const SESSION_KEY = 'wb_currentUser';  // logged-in user for this browser session
const REDIRECT_AFTER_LOGIN = 'index.html';

// ---------- Panel toggle ----------
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

function showSignUp() { container.classList.add('right-panel-active'); }
function showSignIn() { container.classList.remove('right-panel-active'); }

signUpButton.addEventListener('click', showSignUp);
signInButton.addEventListener('click', showSignIn);
document.getElementById('mobileToSignIn').addEventListener('click', (e) => { e.preventDefault(); showSignIn(); });
document.getElementById('mobileToSignUp').addEventListener('click', (e) => { e.preventDefault(); showSignUp(); });

// ---------- Storage helpers ----------
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Hash the password so it is not stored as plain text.
// crypto.subtle only works on https/localhost; falls back to plain text otherwise (prototype only).
async function hashPassword(password) {
  if (window.crypto && crypto.subtle) {
    const data = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return password;
}

// ---------- Validation helpers ----------
// Zambian mobile numbers: MTN (096/076), Airtel (097/077), Zamtel (095/075)
function normalisePhone(raw) {
  const cleaned = raw.replace(/[\s-]/g, '');
  const m = cleaned.match(/^(?:\+260|260|0)?((?:9|7)[567]\d{7})$/);
  return m ? '+260' + m[1] : null;
}

function setMessage(el, text, type) {
  el.textContent = text;
  el.className = 'message ' + (type || '');
}

function markInvalid(...inputs) {
  inputs.forEach(i => i.classList.add('invalid'));
}

function clearInvalid(form) {
  form.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));
}

// ---------- Sign up ----------
document.getElementById('signUpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  clearInvalid(form);

  const nameEl = document.getElementById('suName');
  const phoneEl = document.getElementById('suPhone');
  const emailEl = document.getElementById('suEmail');
  const passEl = document.getElementById('suPassword');
  const confirmEl = document.getElementById('suConfirm');
  const msg = document.getElementById('suMessage');

  const name = nameEl.value.trim();
  const phone = normalisePhone(phoneEl.value);
  const email = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  if (name.length < 2) { markInvalid(nameEl); return setMessage(msg, 'Please enter your full name.', 'error'); }
  if (!phone) { markInvalid(phoneEl); return setMessage(msg, 'Enter a valid Zambian number, e.g. 0977123456.', 'error'); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { markInvalid(emailEl); return setMessage(msg, 'Enter a valid email address.', 'error'); }
  if (password.length < 6) { markInvalid(passEl); return setMessage(msg, 'Password must be at least 6 characters.', 'error'); }
  if (password !== confirmEl.value) { markInvalid(confirmEl); return setMessage(msg, 'Passwords do not match.', 'error'); }

  const users = getUsers();
  if (users.some(u => u.email === email)) { markInvalid(emailEl); return setMessage(msg, 'That email is already registered.', 'error'); }
  if (users.some(u => u.phone === phone)) { markInvalid(phoneEl); return setMessage(msg, 'That phone number is already registered.', 'error'); }

  users.push({
    id: 'U' + Date.now(),
    name,
    phone,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString()
  });
  saveUsers(users);

  form.reset();
  setMessage(msg, '', '');

  // Switch to sign in and pre-fill the email
  document.getElementById('siEmail').value = email;
  setMessage(document.getElementById('siMessage'), 'Account created! Please sign in.', 'success');
  showSignIn();
});

// ---------- Sign in ----------
document.getElementById('signInForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  clearInvalid(form);

  const emailEl = document.getElementById('siEmail');
  const passEl = document.getElementById('siPassword');
  const msg = document.getElementById('siMessage');

  const email = emailEl.value.trim().toLowerCase();
  const password = passEl.value;

  if (!email || !password) {
    markInvalid(emailEl, passEl);
    return setMessage(msg, 'Enter your email and password.', 'error');
  }

  const user = getUsers().find(u => u.email === email);
  const hash = await hashPassword(password);

  if (!user || user.passwordHash !== hash) {
    markInvalid(emailEl, passEl);
    return setMessage(msg, 'Incorrect email or password.', 'error');
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, phone: user.phone, email: user.email }));
  setMessage(msg, 'Welcome, ' + user.name + '!', 'success');
  setTimeout(() => { window.location.href = REDIRECT_AFTER_LOGIN; }, 600);
});
