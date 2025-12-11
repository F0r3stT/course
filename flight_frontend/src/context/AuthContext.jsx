// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

// ключ, под которым данные будут лежать в localStorage
const STORAGE_KEY = "flightboard_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // флаг, чтобы не редиректить, пока восстанавливаемся из localStorage
  const [initializing, setInitializing] = useState(true);

  // 1) один раз при старте читаем из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user && parsed?.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch (e) {
      console.error("[Auth] error reading from localStorage", e);
    } finally {
      setInitializing(false);
    }
  }, []);

  // 2) при каждом изменении user/token записываем/очищаем localStorage
  useEffect(() => {
    if (initializing) return;
    try {
      if (user && token) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user, token })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("[Auth] error writing to localStorage", e);
    }
  }, [user, token, initializing]);

  // 3) логин через бэкенд
  async function login(username, password) {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Ошибка авторизации");
    }

    const data = await res.json().catch(() => ({}));

    // адаптируй под ответ твоего бэкенда
    const authUser =
      data.user ??
      ({
        id: data.id ?? 1,
        username,
        role: data.role ?? "admin",
      });

    const authToken =
      data.token ?? data.jwt ?? data.access_token ?? "mock-token";

    setUser(authUser);
    setToken(authToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  const value = { user, token, login, logout, initializing };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
