// src/context/AuthContext.jsx (обновление)
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "flightboard_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

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

  useEffect(() => {
    if (initializing) return;
    try {
      if (user && token) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("[Auth] error writing to localStorage", e);
    }
  }, [user, token, initializing]);

  async function login(username, password) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Ошибка авторизации");
    }

    const data = await res.json();
    
    // Проверяем роль пользователя
    if (!data.user || !data.user.role) {
      throw new Error("Некорректный ответ сервера");
    }

    // Сохраняем пользователя
    setUser(data.user);
    setToken(data.token);
  }

  async function register(userData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Ошибка регистрации");
    }

    const data = await res.json();
    
    // Автоматически логиним после регистрации
    setUser(data.user);
    setToken(data.token);
    
    return data;
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  // Проверка прав
  function hasPermission(requiredRole) {
    if (!user) return false;
    
    const roleHierarchy = {
      'viewer': 1,
      'staff': 2,
      'admin': 3
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }

  const value = { 
    user, 
    token, 
    login, 
    register,
    logout, 
    initializing,
    hasPermission,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isViewer: user?.role === 'viewer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}