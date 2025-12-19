// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
 const [isLeaving, setIsLeaving] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);


  const goBackSmooth = () => {
    setIsLeaving(true);
    setTimeout(() => {
      navigate("/", { replace: true });
    }, 220); // длительность совпадает с CSS-анимацией
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isLeaving ? "page-leave" : ""}`}>
      {/* Анимированный фон на весь экран */}
      <div className="login-background">
        <div className="login-radar-glow"></div>
        <div className="login-grid-lines"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <span className="login-logo-icon">✈</span>
              <span className="login-logo-text">FlightBoard</span>
            </div>
            <h2 className="login-title">Вход в систему</h2>
            <p className="login-subtitle">
              Панель управления авиарейсами
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group animated-input">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                required
                autoComplete="username"
              />
              <label htmlFor="username">Логин</label>
              <div className="input-icon"></div>
            </div>

            <div className="form-group animated-input">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                autoComplete="current-password"
              />
              <label htmlFor="password">Пароль</label>
              <div className="input-icon"></div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon"></span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Вход...
                </>
              ) : (
                "Войти в систему"
              )}
            </button>

            <button
                type="button"
                className="back-button"
                onClick={goBackSmooth}
                disabled={loading}
              >
                Назад
              </button>
          </form>
        </div>
      </div>
    </div>
  );
}