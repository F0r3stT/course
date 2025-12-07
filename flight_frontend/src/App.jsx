import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import FlightsPage from "./pages/FlightsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

// базовые стили
import "./styles/layout.css";
import "./styles/controls.css";
import "./styles/table.css";
import "./styles/modal.css";
import "./App.css";

function PrivateRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppShell() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">FLY WINGS</div>

        <div className="app-user-block">
          {user ? (
            <>
              <span className="app-user-text">
                Пользователь: {user.username} ({user.role})
              </span>
              <button className="btn btn-primary" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <span className="app-user-text">Режим посетителя</span>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          <Route
            path="/"
            element={
              <PrivateRoute>
                <FlightsPage />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
