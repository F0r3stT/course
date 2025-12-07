// src/pages/LoginPage.jsx
import { useState } from "react";
import { login as apiLogin } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage({ onSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin(username, password);
      login(data.user, data.token);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h2 className="login-title">Вход для сотрудников</h2>
      <p className="login-subtitle">
        Используйте корпоративный логин и пароль для доступа к управлению
        рейсами.
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Логин
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && <div className="text-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
