(() => {
  const LOGIN_PAGE = "/auth.html";

  document.documentElement.classList.add("auth-pending");

  function initHeader(user) {
    const nameEl = document.getElementById("userName");
    const logoutBtn = document.getElementById("logoutBtn");

    if (nameEl) nameEl.textContent = user.name;
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await WB.logout();
        } finally {
          window.location.replace(LOGIN_PAGE);
        }
      });
    }
  }

  function whenReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  async function checkSession() {
    try {
      const response = await WB.me();
      window.currentUser = response.user;
      document.documentElement.classList.remove("auth-pending");
      whenReady(() => initHeader(response.user));
    } catch (_error) {
      window.location.replace(LOGIN_PAGE);
    }
  }

  checkSession();
})();
