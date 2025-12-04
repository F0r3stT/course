// src/App.jsx
import "./App.css";
import FlightsPage from "./pages/FlightsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function App() {
  const { isAuthenticated, user, logout, initialized } = useAuth();

  // Пока не прочитали данные из localStorage — можно показать пустую заглушку
  if (!initialized) {
    return <div style={{ padding: 20 }}>Загрузка...</div>;
  }

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
        <h1 style={{ margin: 0, fontSize: 24 }}>Рейсы авиакомпании</h1>

        {isAuthenticated && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>
              Пользователь: <strong>{user.username}</strong> ({user.role})
            </span>
            <button onClick={logout}>Выйти</button>
          </div>
        )}
      </header>

      <main style={{ padding: 24 }}>
        {isAuthenticated ? <FlightsPage /> : <LoginPage />}
      </main>
    </div>
  );
}

export default App;
