// src/App.jsx
import "./App.css";
import FlightsPage from "./pages/FlightsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useEffect, useState } from "react";

function App() {
  const { isAuthenticated, user, logout, initialized } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Как только залогинились — скрываем форму логина и показываем табло с правами
  useEffect(() => {
    if (isAuthenticated) {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  if (!initialized) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
  }

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  return (
    <div className="App">
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Онлайн-табло рейсов</h1>
          <p style={{ margin: "4px 0 0 0", color: "#555", fontSize: 14 }}>
            Прилёты и вылеты. Посетитель видит табло, сотрудники могут
            редактировать рейсы.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isAuthenticated && user ? (
            <>
              <span>
                Пользователь: <strong>{user.username}</strong> ({user.role})
              </span>
              <button onClick={logout}>Выйти</button>
            </>
          ) : (
            <button onClick={handleLoginClick}>Войти</button>
          )}
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        {showLogin && !isAuthenticated ? (
          <LoginPage />
        ) : (
          <FlightsPage />
        )}
      </main>
    </div>
  );
}

export default App;
