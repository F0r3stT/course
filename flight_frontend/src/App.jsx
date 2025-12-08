// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import FlightsPage from "./pages/FlightsPage.jsx";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// Отдельный компонент, который знает про роуты и шапку
function AppContent() {
  const { user, logout } = useAuth() || {};

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <div className="logo">
              <span className="logo-icon">✈</span>
              <span>FlightBoard</span>
            </div>

            <nav className="nav">
              <Link to="/">Главная</Link>
              <Link to="/flights">Рейсы</Link>
              {user && <Link to="/dashboard">Панель</Link>}
              {user?.role === "admin" && <Link to="/analytics">Аналитика</Link>}
            </nav>

            <div>
              {!user ? (
                <Link to="/login">Войти</Link>
              ) : (
                <>
                  <span style={{ marginRight: "1rem" }}>
                    {user.username} ({user.role})
                  </span>
                  <button type="button" onClick={logout}>
                    Выйти
                  </button>
                </>
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
            <Route path="/flights" element={<FlightsPage />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>FlightBoard © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

// Единственный default-компонент App
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
