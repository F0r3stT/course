// src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function PrivateRoute({ children, requiredRole }) {
  const { user, initializing } = useAuth() || {};

  if (initializing) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const { user, logout } = useAuth() || {};
  const navigate = useNavigate();

  const handleLogout = () => {
    // ВАЖНО: сначала уходим на главную, потом чистим auth
    navigate("/", { replace: true });
    setTimeout(() => logout(), 0);
  };

  return (
    <div className="app full-height">
      <header className="app-header">
        <div className="header-content">
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
              <Link to="/login" className="btn btn-login">Войти</Link>
            ) : (
              <div className="user-section">
                <span className="user-name">{user.username}</span>
                <button type="button" onClick={handleLogout} className="btn-logout">
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

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

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
        <p className="footer-subtitle">Система управления авиарейсами</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
