// src/App.jsx
import { useState } from "react";
import "./App.css";
import FlightsPage from "./pages/FlightsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogin(false);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-main">FLY WINGS</div>
          <div className="app-logo-sub">airport flight monitor</div>
        </div>

        <div className="app-header-right">
          {user ? (
            <>
              <span className="app-user-label">
                Вошли как: <strong>{user.username}</strong> ({user.role})
              </span>
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <span className="app-user-label">Режим посетителя</span>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => setShowLogin(true)}
              >
                Войти как сотрудник
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="board-shell">
          <FlightsPage />
        </div>
      </main>

      {showLogin && !user && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <LoginPage onSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
