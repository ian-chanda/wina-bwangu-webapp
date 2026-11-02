(() => {
  async function req(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("json") ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = (typeof data === "object" && data && data.error) ? data.error : res.statusText;
      throw new Error(msg);
    }
    return data;
  }

  window.WB = {
    meta: () => req("GET", "/api/meta"),
    register: (p) => req("POST", "/api/auth/register", p),
    login: (p) => req("POST", "/api/auth/login", p),
    logout: () => req("POST", "/api/auth/logout"),
    me: () => req("GET", "/api/auth/me"),
    transactions: () => req("GET", "/api/transactions"),
    createTransaction: (p) => req("POST", "/api/transactions", p),
    dashboard: () => req("GET", "/api/dashboard"),
  };
})();
