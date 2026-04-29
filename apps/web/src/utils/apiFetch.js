// Shared authenticated fetch for all API calls
// Auto-attaches Bearer token from localStorage

import { getToken } from "./useAuth";

export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("putzo_token");
      localStorage.removeItem("putzo_user");
      window.location.reload();
    }
    throw new Error("Nicht angemeldet");
  }

  if (!res.ok) {
    let msg = `Fehler ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
