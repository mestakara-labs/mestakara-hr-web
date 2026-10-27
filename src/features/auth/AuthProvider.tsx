"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { apiGet, apiPost } from "@/lib/http-client";
import type { UserResource } from "@/types/api/user";
import { toAuthUser, type AuthUser } from "@/types/auth";

interface AuthContextValue {
  /** User yang sedang login, atau null kalau belum login. */
  user: AuthUser | null;
  /** true selama pengecekan sesi pertama ke /api/auth/me */
  loading: boolean;
  /** Dipanggil halaman login setelah login berhasil, supaya data user langsung tersedia. */
  setUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Menyimpan data user yang login untuk seluruh aplikasi.
 *
 * Token ada di cookie HttpOnly (tidak bisa dibaca JavaScript), jadi
 * satu-satunya cara tahu user sedang login adalah memanggil `/api/auth/me`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Saat aplikasi pertama dibuka: tanyakan ke server siapa user yang login.
  useEffect(() => {
    // Kalau komponen sudah hilang sebelum jawaban server datang,
    // hasilnya diabaikan (state tidak boleh diubah lagi).
    let isCancelled = false;

    async function checkSession() {
      try {
        const { data } = await apiGet<UserResource>("/api/auth/me");
        if (!isCancelled) setUser(toAuthUser(data));
      } catch {
        // 401 = belum login. Error lain juga dianggap "belum login"
        // supaya aplikasi tidak menggantung di layar loading.
        if (!isCancelled) setUser(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    checkSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  function saveLoggedInUser(loggedInUser: AuthUser) {
    setUser(loggedInUser);
    setLoading(false);
  }

  async function logout() {
    try {
      await apiPost("/api/auth/logout");
    } catch (error) {
      // Cookie tetap dibuang di server; kalaupun request gagal total,
      // user tetap dikeluarkan dari tampilan.
      console.error("Logout gagal dikirim ke server:", error);
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser: saveLoggedInUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Ambil data login dari komponen mana pun: `const { user, logout } = useAuth();` */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }

  return context;
}
