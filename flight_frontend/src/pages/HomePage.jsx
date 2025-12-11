import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import AirportSelector from "../components/flights/AirportSelector.jsx";
import WeatherWidget from "../components/common/WeatherWidget.jsx";

import FlightsTable from "../components/flights/FlightsTable.jsx";
import FlightDetailsModal from "../components/flights/FlightDetailsModal.jsx";
import FlightSearch from "../components/flights/FlightSearch.jsx";
import FlightSearchResults from "../components/flights/FlightSearchResults.jsx";
import "../components/flights/FlightSearch.css";
import "../components/flights/FlightSearchResults.css";


import { AIRPORT_TO_CITY } from "../utils/airports.js"; // Импортируем из общего файла

import "./HomePage.css";

const API_BASE = "http://localhost:8080";

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    airports: 0,
    airlines: 0,
  });
  const scrollToBoard = () => {
    const el = document.getElementById("flight-board");
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  
  const [featuredFlights, setFeaturedFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  const [boardFlights, setBoardFlights] = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [searchResults, setSearchResults] = useState([]);


  const [showBoard, setShowBoard] = useState(false);
const [boardAnimation, setBoardAnimation] = useState("");

  // ---------- Функции загрузки данных ----------

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
  const toggleBoard = () => {
  if (!showBoard) {
    // открываем
    setShowBoard(true);
    setBoardAnimation("home-board-animate-in");

    // после рендера – плавный скролл к секции табло
    setTimeout(() => {
      const el = document.getElementById("flight-board-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  } else {
    // закрываем с анимацией
    setBoardAnimation("home-board-animate-out");
    setTimeout(() => {
      setShowBoard(false);
      setBoardAnimation("");
    }, 300); // то же время, что и в CSS
  }
};

// Обновляем кнопку в hero-actions:
<button
  className="btn btn-secondary"
  type="button"
  onClick={toggleBoard}
>
  {showBoard ? "Скрыть табло" : "Посмотреть табло"}
</button>

  const popularFlights = React.useMemo(() => {
    if (!featuredFlights || featuredFlights.length === 0) return [];

    const map = new Map();

    featuredFlights.forEach((f) => {
      const key = `${f.departure_airport}-${f.arrival_airport}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          ...f,
          flightsCount: 1,
        });
      } else {
        const flightsCount = existing.flightsCount + 1;
        // берём самый поздний рейс по времени вылета как代表
        const existingDep = new Date(existing.departure_time);
        const currentDep = new Date(f.departure_time);
        map.set(key, {
          ...(currentDep > existingDep ? f : existing),
          flightsCount,
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.flightsCount - a.flightsCount)
      .slice(0, 4);
  }, [featuredFlights]);

  const fetchFeaturedFlights = async () => {
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/flights`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ошибка /api/flights: ${res.status} ${text}`);
    }
    const data = await res.json();
    const flights = Array.isArray(data) ? data : data.flights || [];
    setFeaturedFlights(flights);
  } catch (error) {
    console.error("[HomePage] Error fetching featured flights:", error);
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
    // ВАЖНО: не очищаем табло рейсов при ошибке
    // setBoardFlights([]);
  } finally {
    setBoardLoading(false);
    console.log("[HomePage] fetchBoardFlights: done");
  }
};
  

  // ---------- Инициализация и периодическое обновление ----------

  useEffect(() => {
    fetchStats();
    fetchFeaturedFlights();
    fetchBoardFlights();

    const interval = setInterval(() => {
      fetchStats();
      fetchBoardFlights();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ---------- Обработчики ----------

  const handleQuickSearch = (searchData) => {
    console.log("Поиск рейсов:", searchData);
    // Фильтруем рейсы на главной странице
    // Реализация будет в компоненте FlightsTable
  };

  // ---------- Рендер ----------

  return (
    <div className="home-page full-height">
      {/* Герой-секция */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="clouds"></div>
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

            {/* Кнопка "Посмотреть табло" теперь скроллит к секции табло */}
            <button
              className="btn btn-outline btn-large"
              type="button"
              onClick={scrollToBoard}
              style={{
                background: "transparent",
                border: "2px solid white",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="icon-board" style={{ fontSize: "1.2rem" }}>
                📋
              </i>
              Посмотреть табло
            </button>
      <a 
        href="#flight-search" 
        className="btn btn-outline btn-large"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('flight-search').scrollIntoView({ 
            behavior: 'smooth' 
          });
        }}
      >
                    <i className="icon-search"></i>
                    Поиск рейсов
                  </a>
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
      <section className="quick-search-section" id="flight-search">
        <div className="container">
          <div className="section-header">
          </div>
          
          <div className="search-card">
            <FlightSearch 
              flights={boardFlights} 
              onSearchResults={setSearchResults}
            />
            
            <FlightSearchResults
              results={searchResults}
              onSelectFlight={setSelectedFlight}
            />
          </div>
        </div>
      </section>

      {/* Табло рейсов */}
      <section className="board-section" id="flight-board">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Табло рейсов</h2>
            <div className="last-updated">
              Обновлено: {new Date().toLocaleTimeString("ru-RU")}
            </div>
          </div>

          {boardLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загрузка табло рейсов...</p>
            </div>
          ) : (
            <FlightsTable
              flights={boardFlights}
              mode="departures"
              isAdmin={false}
              onSelectFlight={setSelectedFlight}
            />
          )}
{showBoard && (
  <section
    id="flight-board-section"
    className={`home-board-section ${boardAnimation}`}
  >
    {/* существующий код табло */}
    <FlightsTable
      flights={boardFlights}
      loading={boardLoading}
      onSelectFlight={handleSelectFlight}
    />

    {/* если есть FlightSearch / FlightSearchResults – оставляем как было */}
  </section>
)}
          <FlightDetailsModal
            flight={selectedFlight}
            onClose={() => setSelectedFlight(null)}
          />
        </div>
      </section>

      {/* Популярные направления */}
      <section className="recent-flights-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Популярные направления</h2>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Загрузка рейсов...</p>
            </div>
          ) : (
            <div className="flights-grid">
    {popularFlights.map((flight) => {
                const departureCity = AIRPORT_TO_CITY[flight.departure_airport] || flight.departure_airport;
                const arrivalCity = AIRPORT_TO_CITY[flight.arrival_airport] || flight.arrival_airport;
                
                return (
                  <div
                    key={flight.id}
                    className="flight-card"
                    onClick={() => setSelectedFlight(flight)}
                  >
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
                        <span className="city">{departureCity}</span>
                        <span className="time">
                          {new Date(flight.departure_time).toLocaleTimeString([], {
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
                        <span className="city">{arrivalCity}</span>
                        <span className="time">
                          {new Date(flight.arrival_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flight-footer">
                      <span className="airline">{flight.airline_name || "Авиакомпания не указана"}</span>
                      <span className="duration">
                        {Math.floor(flight.flight_duration_minutes / 60)}ч{" "}
                        {flight.flight_duration_minutes % 60}м
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Информация о системе */}
      <section className="system-info-section">
        <div className="container">
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