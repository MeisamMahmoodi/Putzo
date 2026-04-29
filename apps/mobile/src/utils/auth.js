// Single mobile auth system — SecureStore + Bearer token
// Mirrors the web /api/auth/login endpoint

import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "putzo_token";
const USER_KEY = "putzo_user";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BASE_URL || "";

function apiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [t, u] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const signIn = useCallback(async (email, password) => {
    setError(null);
    const res = await fetch(apiUrl("/api/auth/login"), {
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

    const { token: t, user: u } = await res.json();
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, t),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(u)),
    ]);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]).catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  // Authenticated fetch — always includes Bearer token
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };
      const res = await fetch(apiUrl(url), { ...options, headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Fehler ${res.status}`);
      }
      return res.json();
    },
    [token],
  );

  return {
    user,
    token,
    loading,
    error,
    signIn,
    signOut,
    authFetch,
    isAuthenticated: !!user,
  };
}
