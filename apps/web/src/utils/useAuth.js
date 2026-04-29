"use client";
// Single auth system for web — localStorage-based JWT
// Mobile uses the same /api/auth/login endpoint with SecureStore

import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "putzo_token";
const USER_KEY = "putzo_user";

// Module-level state so all hook instances share one user
let _globalUser = null;
let _listeners = new Set();

function notifyListeners() {
  _listeners.forEach((fn) => fn(_globalUser));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();
    if (stored && token) {
      _globalUser = stored;
      setUser(stored);
    }
    setLoading(false);

    const listener = (newUser) => setUser(newUser);
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data.error || "Login fehlgeschlagen";
      setError(msg);
      throw new Error(msg);
    }

    const { token, user: userData } = await res.json();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    _globalUser = userData;
    notifyListeners();
    return userData;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    _globalUser = null;
    notifyListeners();
  }, []);

  return { user, loading, error, signIn, signOut };
}

export default useAuth;
