import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import AirportSelector from "../components/flights/AirportSelector.jsx";
import SecurityBadge from "../components/security/SecurityBadge.jsx";
import WeatherWidget from "../components/common/WeatherWidget.jsx";

import FlightsTable from "../components/flights/FlightsTable.jsx";
import FlightDetailsModal from "../components/flights/FlightDetailsModal.jsx";

import "./HomePage.css";

const API_BASE = "http://localhost:8080";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    airports: 0,
    airlines: 0,
  });

  const [featuredFlights, setFeaturedFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const [boardFlights, setBoardFlights] = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);

  const [selectedFlight, setSelectedFlight] = useState(null);

  // ---------- Функции загрузки данных (объявлены ДО useEffect) ----------

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (!res.ok) {
        throw new Error(`Ошибка /api/stats: ${res.status}`);
      }
      const data = await res.json();

      setStats({
        totalFlights: data.total_flights ?? data.totalFlights ?? 0,
        activeFlights: data.active_flights ?? data.activeFlights ?? 0,
        airports: data.airports ?? 0,
        airlines: data.airlines ?? 0,
      });
    } catch (error) {
      console.error("[HomePage] Error fetching stats:", error);
    }
  };

  const fetchFeaturedFlights = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/flights`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ошибка /api/flights: ${res.status} ${text}`);
      }
      const data = await res.json();
      // Ожидаем массив; если вдруг приходит объект – берём поле flights
      const flights = Array.isArray(data) ? data : data.flights || [];
      setFeaturedFlights(flights);
    } catch (error) {
      console.error("[HomePage] Error fetching featured flights:", error);
      setFeaturedFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardFlights = async () => {
    console.log("[HomePage] fetchBoardFlights: start");
    setBoardLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/flights`);
      console.log("[HomePage] /api/flights status =", res.status);

      const text = await res.text();
      console.log("[HomePage] /api/flights raw body =", text);

      if (!res.ok) {
        throw new Error(`Не удалось загрузить табло рейсов: ${res.status}`);
      }

      const data = JSON.parse(text);
      const flights = Array.isArray(data) ? data : data.flights || [];
      setBoardFlights(flights);
    } catch (error) {
      console.error("[HomePage] fetchBoardFlights error:", error);
      setBoardFlights([]);
    } finally {
      setBoardLoading(false);
      console.log("[HomePage] fetchBoardFlights: done");
    }
  };

  // ---------- Инициализация и периодическое обновление ----------

  useEffect(() => {
    // первый загрузочный запрос
    fetchStats();
    fetchFeaturedFlights();
    fetchBoardFlights();

    // периодическое обновление
    const interval = setInterval(() => {
      fetchStats();
      fetchBoardFlights();
    }, 30000);

    return () => clearInterval(interval);
  }, []); // зависимости пустые – эффекты только при монтировании/размонтировании

  // ---------- Обработчики ----------

  const handleQuickSearch = (searchData) => {
    navigate(`/flights?search=${encodeURIComponent(JSON.stringify(searchData))}`);
  };

  // ---------- Рендер ----------

  return (
    <div className="home-page">
      {/* Герой-секция с анимированным фоном */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="clouds"></div>
          <div className="airplane-animation"></div>
          <div className="radar-scan"></div>
        </div>

        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">FlightBoard</span>
              <span className="subtitle">Система управления рейсами</span>
            </h1>

            <p className="hero-description">
              Современная платформа для отслеживания и управления авиарейсами
              с акцентом на безопасность и надежность данных.
            </p>

            <div className="hero-actions">
              {!user ? (
                <>
                  <Link to="/login" className="btn btn-primary btn-large">
                    <i className="icon-lock"></i>
                    Вход для сотрудников
                  </Link>
                  <Link to="/flights" className="btn btn-outline btn-large">
                    <i className="icon-search"></i>
                    Поиск рейсов
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="btn btn-primary btn-large">
                    <i className="icon-dashboard"></i>
                    Панель управления
                  </Link>
                  {user.role === "admin" && (
                    <Link to="/analytics" className="btn btn-outline btn-large">
                      <i className="icon-analytics"></i>
                      Аналитика
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="hero-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">✈</div>
                <div className="stat-value">
                  {stats.totalFlights.toLocaleString()}
                </div>
                <div className="stat-label">Всего рейсов</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-value">{stats.activeFlights}</div>
                <div className="stat-label">В воздухе</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏢</div>
                <div className="stat-value">{stats.airports}</div>
                <div className="stat-label">Аэропортов</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.airlines}</div>
                <div className="stat-label">Авиакомпаний</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Быстрый поиск */}
      <section className="quick-search-section">
        <div className="container">
          <h2 className="section-title">Быстрый поиск рейсов</h2>
          <div className="search-card">
            <AirportSelector onSearch={handleQuickSearch} />
            <div className="search-tips">
              <p>
                💡 <strong>Советы по поиску:</strong>
              </p>
              <ul>
                <li>Используйте код аэропорта (SVO, DME, LED)</li>
                <li>Номер рейса должен содержать только цифры</li>
                <li>Вы можете искать по маршруту или статусу</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Табло рейсов */}
        <section className="board-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Табло рейсов</h2>
              <Link to="/flights" className="btn-link">
                Все рейсы <i className="icon-arrow-right"></i>
              </Link>
            </div>
            
                      <FlightsTable
            flights={boardFlights}
            loading={boardLoading}
            onSelectFlight={setSelectedFlight}
          />

          {selectedFlight && (
            <FlightDetailsModal
              flight={selectedFlight}
              onClose={() => setSelectedFlight(null)}
            />
          )}

          </div>
        </section>

      {/* Безопасность и преимущества */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Безопасность и надежность</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Защита данных</h3>
              <p>
                Шифрование всех данных, двухфакторная аутентификация, аудит
                действий
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Реальное время</h3>
              <p>
                Обновление статусов рейсов в реальном времени с задержкой менее
                5 секунд
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Аналитика</h3>
              <p>
                Подробная статистика и аналитические отчеты для принятия
                решений
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Уведомления</h3>
              <p>Автоматические оповещения об изменениях статуса рейсов</p>
            </div>
          </div>
        </div>
      </section>

      {/* Последние рейсы */}
      <section className="recent-flights-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Недавние рейсы</h2>
            <Link to="/flights" className="btn-link">
              Все рейсы <i className="icon-arrow-right"></i>
            </Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загрузка рейсов...</p>
            </div>
          ) : (
            <div className="flights-grid">
              {featuredFlights.slice(0, 6).map((flight) => (
                <Link
                  key={flight.id}
                  to={`/flights/${flight.id}`}
                  className="flight-card-link"
                >
                  <div className="flight-card">
                    <div className="flight-header">
                      <span className="flight-number">
                        {flight.flight_number}
                      </span>
                      <span
                        className={`flight-status status-${flight.status}`}
                      >
                        {getStatusText(flight.status)}
                      </span>
                    </div>

                    <div className="flight-route">
                      <div className="route-segment">
                        <span className="airport-code">
                          {flight.departure_airport}
                        </span>
                        <span className="city">{flight.departure_city}</span>
                        <span className="time">
                          {new Date(
                            flight.departure_time
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="route-line">
                        <div className="line"></div>
                        <div className="plane-icon">✈</div>
                      </div>

                      <div className="route-segment">
                        <span className="airport-code">
                          {flight.arrival_airport}
                        </span>
                        <span className="city">{flight.arrival_city}</span>
                        <span className="time">
                          {new Date(
                            flight.arrival_time
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flight-footer">
                      <span className="airline">{flight.airline_name}</span>
                      <span className="duration">
                        {Math.floor(
                          flight.flight_duration_minutes / 60
                        )}
                        ч{" "}
                        {flight.flight_duration_minutes % 60}
                        м
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Информация о системе */}
      <section className="system-info-section">
        <div className="container">
          <SecurityBadge />
          <WeatherWidget />

          <div className="system-status">
            <h3>Статус системы</h3>
            <div className="status-indicators">
              <div className="status-indicator status-ok">
                <div className="status-dot"></div>
                <span>API: Работает</span>
              </div>
              <div className="status-indicator status-ok">
                <div className="status-dot"></div>
                <span>База данных: Активна</span>
              </div>
              <div className="status-indicator status-ok">
                <div className="status-dot"></div>
                <span>Обновления: Авто</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function getStatusText(status) {
  const statusMap = {
    scheduled: "По расписанию",
    boarding: "Посадка",
    delayed: "Задержан",
    cancelled: "Отменен",
    in_air: "В воздухе",
    landed: "Приземлился",
  };
  return statusMap[status] || status;
}
