// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import CreateFlightTab from "../components/flights/CreateFlightTab.jsx";
import {
  fetchFlights,
  fetchAirlines,
  updateFlightStatus,
} from "../api/flightsApi";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flights");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [flightsData, airlinesData] = await Promise.all([
        fetchFlights(),
        fetchAirlines(),
      ]);
      setFlights(flightsData);
      setAirlines(airlinesData);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeStatus(flightId, newStatus) {
    try {
      setStatusUpdatingId(flightId);
      await updateFlightStatus(flightId, newStatus);

      setFlights((prev) =>
        prev.map((f) => (f.id === flightId ? { ...f, status: newStatus } : f))
      );
    } catch (err) {
      console.error("Error updating flight status:", err);
      alert(err.message || "Ошибка обновления статуса рейса");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  const isAdmin = user && user.role === "admin";

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка данных о рейсах...</p>
      </div>
    );
  }

  return (
    <div className="dashboard full-height">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✈</span>
            <div>
              <h1>Панель управления</h1>
              <p className="subtitle">FlightBoard Pro</p>
            </div>
          </div>

          <div className="user-section">
            {user ? (
              <>
                <div className="user-info">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={logout} className="btn-logout">
                  Выйти
                </button>
              </>
            ) : (
              <div className="guest-notice">Гостевой режим</div>
            )}
          </div>
        </div>

        {/* TABS */}
        <nav className="tabs">
          <button className={`tab ${activeTab === "flights" ? "active" : ""}`} onClick={() => setActiveTab("flights")}>
            ✈ Все рейсы
          </button>
          <button className={`tab ${activeTab === "airlines" ? "active" : ""}`} onClick={() => setActiveTab("airlines")}>
            🏢 Авиакомпании
          </button>
          <button className={`tab ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>
            ➕ Добавить рейс
          </button>
          <button className={`tab ${activeTab === "stats" ? "active" : ""}`} onClick={() => setActiveTab("stats")}>
            📊 Статистика
          </button>
        </nav>
      </header>

      {/* MAIN – один и тот же каркас, меняется только панель вкладки */}
      <main className="dashboard-main">
        <div className="tab-panels">
          {/* Вкладка "Все рейсы" */}
          <section
            className={`tab-panel ${
              activeTab === "flights" ? "active" : "hidden"
            }`}
          >
            <div className="flights-table-container">
              <div className="table-header">
                <div className="header-cell">Рейс</div>
                <div className="header-cell">Авиакомпания</div>
                <div className="header-cell">Маршрут</div>
                <div className="header-cell">Время</div>
                <div className="header-cell">Статус</div>
                {isAdmin && <div className="header-cell">Управление</div>}
              </div>

              <div className="table-body">
                {flights.map((flight) => (
                  <div key={flight.id} className="table-row">
                    <div className="table-cell flight-number">
                      {flight.flight_number}
                    </div>

                    <div className="table-cell airline">
                      <span className="airline-code">{flight.airline_code}</span>
                      <span className="airline-name">{flight.airline_name}</span>
                    </div>

                    <div className="table-cell route">
                      <span className="airport">
                        {flight.departure_airport}
                      </span>
                      <span className="separator">→</span>
                      <span className="airport">{flight.arrival_airport}</span>
                    </div>

                    <div className="table-cell time">
                      <div className="departure">
                        Вылет: {formatTime(flight.departure_time)}
                      </div>
                      <div className="arrival">
                        Прилёт: {formatTime(flight.arrival_time)}
                      </div>
                        </div>

                    <div className="table-cell status">
                      <span
                        className={`status-badge status-${flight.status}`}
                      >
                        {getStatusText(flight.status)}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="table-cell actions">
                        <select
                          value={flight.status || "scheduled"}
                          disabled={statusUpdatingId === flight.id}
                          onChange={(e) =>
                            handleChangeStatus(flight.id, e.target.value)
                          }
                          className="status-select"
                        >
                          <option value="scheduled">По расписанию</option>
                          <option value="boarding">Посадка</option>
                          <option value="in_air">В полёте</option>
                          <option value="landed">Прибыл</option>
                          <option value="delayed">Задержан</option>
                          <option value="cancelled">Отменён</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Вкладка "Авиакомпании" */}
          <section
            className={`tab-panel ${
              activeTab === "airlines" ? "active" : "hidden"
            }`}
          >
            <div className="airlines-grid">
              {airlines.map((airline) => {
                const airlineFlights = flights.filter(
                  (f) => f.airline_code === airline.code
                );
                return (
                  <div key={airline.code} className="airline-card">
                    <div className="airline-header">
                      <div className="airline-logo">{airline.code}</div>
                      <div className="airline-info">
                        <h3>{airline.name}</h3>
                        <p>{airlineFlights.length} рейсов</p>
                      </div>
                    </div>

                    <div className="airline-stats">
                      <div className="stat">
                        <span>В воздухе:</span>
                        <span>
                          {
                            airlineFlights.filter(
                              (f) => f.status === "in_air"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="stat">
                        <span>По расписанию:</span>
                        <span>
                          {
                            airlineFlights.filter(
                              (f) => f.status === "scheduled"
                            ).length
                          }
                        </span>
                      </div>
                      <div className="stat">
                        <span>Задержано:</span>
                        <span>
                          {
                            airlineFlights.filter(
                              (f) => f.status === "delayed"
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className={`tab-panel ${activeTab === "create" ? "active" : "hidden"}`}>
          <CreateFlightTab onFlightCreated={(newFlight) => {
            // Обновляем список рейсов после создания
            setFlights(prev => [...prev, newFlight]);
            // Переключаемся на вкладку с рейсами
            setActiveTab("flights");
          }} />
</section>

          {/* Вкладка "Статистика" */}
          <section
            className={`tab-panel ${
              activeTab === "stats" ? "active" : "hidden"
            }`}
          >
            <div className="stats-content">
              <h2>Статистика системы</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{flights.length}</div>
                  <div className="stat-label">Всего рейсов</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {flights.filter((f) => f.status === "in_air").length}
                  </div>
                  <div className="stat-label">В воздухе</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{airlines.length}</div>
                  <div className="stat-label">Авиакомпаний</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {flights.filter((f) => f.status === "delayed").length}
                  </div>
                  <div className="stat-label">Задержано</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div className="system-info">
          <span className="status-indicator online"></span>
          Система активна • Последнее обновление:{" "}
          {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}

function getStatusText(status) {
  const statusMap = {
    scheduled: "По расписанию",
    boarding: "Посадка",
    in_air: "В воздухе",
    landed: "Приземлился",
    delayed: "Задержан",
    cancelled: "Отменен",
  };
  return statusMap[status] || status;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
