// Login guard + logout (works with auth.html / auth.js).
// Load this in <head> of every protected page so signed-out visitors are sent to the login page.
(function () {
  const SESSION_KEY = 'wb_currentUser';
  const LOGIN_PAGE = 'auth.html';

  let user = null;
  try { user = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (e) { user = null; }

  if (!user) {
    window.location.replace(LOGIN_PAGE);
    return;
  }

  // Available to other scripts if they need to know who is signed in
  window.currentUser = user;

  document.addEventListener('DOMContentLoaded', function () {
    const nameEl = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (nameEl) nameEl.textContent = user.name;
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace(LOGIN_PAGE);
      });
    }
  });
})();
