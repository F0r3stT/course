// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// === Приватный маршрут ===
function PrivateRoute({ children, requiredRole }) {
  const { user, initializing } = useAuth() || {};

  // Пока восстанавливаем состояние из localStorage — ничего не рендерим
  if (initializing) {
    return null; // можно сюда поставить спиннер/скелетон
  }

  // Если не залогинен — отправляем на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если для маршрута требуется конкретная роль
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { user, logout } = useAuth() || {};

  return (
    <BrowserRouter>
      <div className="app full-height">
        <header className="app-header">
          <div className="header-content">
            {/* Логотип слева, кликабельный → на главную */}
            <Link to="/" className="logo">
              <span className="logo-icon">✈</span>
              <span className="logo-text">FlightBoard</span>
            </Link>

            <nav className="nav">
              {user && <Link to="/dashboard">Панель</Link>}
              {user?.role === "admin" && <Link to="/analytics">Аналитика</Link>}
            </nav>

            <div>
              {!user ? (
                <Link to="/login" className="btn btn-primary btn-login">
                  Войти
                </Link>
              ) : (
                <div className="user-section">
                  <span className="user-name">{user.username}</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="btn-logout"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Закрываем /dashboard от гостей */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Аналитику — только для admin, если нужно */}
            <Route
              path="/analytics"
              element={
                <PrivateRoute requiredRole="admin">
                  <AnalyticsPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>FlightBoard © {new Date().getFullYear()}</p>
          <p className="footer-subtitle">
            Система управления авиарейсами
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}