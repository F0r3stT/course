// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function AppContent() {
  const { user, logout } = useAuth() || {};

  return (
    <BrowserRouter>
      <div className="app full-height">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">✈</span>
              <span>FlightBoard</span>
            </div>

            <nav className="nav">
              {user && <Link to="/dashboard">Панель</Link>}
              {user?.role === "admin" && <Link to="/analytics">Аналитика</Link>}
            </nav>

            <div>
              {!user ? (
                <Link to="/login" className="btn btn-primary">
                  Войти
                </Link>
              ) : (
                <div className="user-section">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role">({user.role})</span>
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>FlightBoard © {new Date().getFullYear()}</p>
          <p className="footer-subtitle">Система управления авиарейсами</p>
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