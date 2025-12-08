import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">✈</span>
            FlightBoard Pro
          </Link>

          <nav className="nav">
            <Link to="/">Главная</Link>
            <Link to="/flights">Рейсы</Link>
            
            {user ? (
              <>
                <Link to="/dashboard">Панель управления</Link>
                {user.role === 'admin' && (
                  <Link to="/analytics">Аналитика</Link>
                )}
                <div className="user-info">
                  <span>{user.username}</span>
                  <span className="user-role-badge">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-outline btn-small">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  Вход для сотрудников
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} FlightBoard Pro. Система безопасного хранения и обработки данных о рейсах авиакомпаний</p>
          <p className="footer-subtitle">Курсовой проект по разработке ПО</p>
        </div>
      </footer>
    </div>
  );
}