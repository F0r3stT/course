// src/pages/LoginPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Создайте этот файл

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
    <div className="login-page">
      <div className="login-background">
        <div className="login-clouds"></div>
        <div className="login-radar"></div>
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
              Система управления рейсами авиакомпаний
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
              <div className="input-icon">👤</div>
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
              <div className="input-icon">🔒</div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Запомнить меня
              </label>
              <a href="#" className="forgot-password">
                Забыли пароль?
              </a>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
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
              onClick={() => navigate(-1)}
            >
              ← Вернуться назад
            </button>
          </form>

          <div className="login-footer">
            <p className="security-note">
              <span className="security-icon">🛡️</span>
              Все данные защищены согласно GDPR и ISO 27001
            </p>
            <div className="login-hint">
              <p><strong>Тестовые учетные данные:</strong></p>
              <div className="credentials">
              
              </div>
            </div>
          </div>
        </div>

        <div className="login-sidebar">
          <div className="sidebar-content">
            <h3 className="sidebar-title">Безопасность системы</h3>
            <div className="security-features">
              <div className="feature">
                <span className="feature-icon">🔐</span>
                <div className="feature-text">
                  <strong>Шифрование TLS 1.3</strong>
                  <p>Все данные передаются по защищенному соединению</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">👁️</span>
                <div className="feature-text">
                  <strong>Мониторинг доступа</strong>
                  <p>Все действия пользователей записываются в аудит-лог</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <strong>Защита от брутфорса</strong>
                  <p>Автоматическая блокировка при множественных попытках</p>
                </div>
              </div>
            </div>
            
            <div className="system-status">
              <div className="status-header">
                <span className="status-icon">✅</span>
                <span>Система активна</span>
              </div>
              <div className="status-details">
                <div className="status-item">
                  <span>API:</span>
                  <span className="status-ok">Работает</span>
                </div>
                <div className="status-item">
                  <span>База данных:</span>
                  <span className="status-ok">Активна</span>
                </div>
                <div className="status-item">
                  <span>Аутентификация:</span>
                  <span className="status-ok">Готова</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}