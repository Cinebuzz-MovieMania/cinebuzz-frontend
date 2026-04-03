import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cinebuzz_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem("cinebuzz_user"); }
    }
    setLoading(false);
  }, []);

  /** Other tabs share localStorage; keep React user in sync so API calls and UI use the same account. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "cinebuzz_user") return;
      if (e.newValue == null) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(e.newValue));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Persists token, userId, name, email, role from POST /auth/login|register. */
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("cinebuzz_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cinebuzz_user");
  };

  const isAdmin = () => user?.role === "ROLE_ADMIN";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
