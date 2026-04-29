"use client";
import { useAuth } from "./useAuth";

export function useUser() {
  const { user, loading } = useAuth();
  return { data: user, loading };
}

export default useUser;
