// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { getCityByAirportCode } from "../utils/airports";
import { useAuth } from "../context/AuthContext";
import CreateFlightTab from "../components/flights/CreateFlightTab.jsx";
import DelayModal from "../components/common/DelayModal";

import {
  fetchFlights,
  fetchAirlines,
  updateFlightStatus,
  deleteFlight,
} from "../api/flightsApi";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flights");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");   // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState(""); // строка поиска
  const [selectedFlight, setSelectedFlight] = useState(null);
  const firstLoad = useRef(true);
  
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // каждые 30 секунд
    return () => clearInterval(interval);
  }, []);
  
function toLocalYMD(dateString) {
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const canDelay = (status) => !["in_air", "landed", "cancelled"].includes(status);

const filteredFlights = flights.filter((f) => {
  if (filterDate && toLocalYMD(f.departure_time) !== filterDate) return false;

  const q = searchQuery.trim().toLowerCase();
  if (!q) return true;

  const hay = [
    f.flight_number,
    f.airline_code,
    f.airline_name,
    f.departure_airport,
    f.arrival_airport,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return hay.includes(q);
});
  
async function loadData() {
  try {
    if (firstLoad.current) {
      setLoading(true);
    }

    const [flightsData, airlinesData] = await Promise.all([
      fetchFlights(),
      fetchAirlines(),
    ]);
    setFlights(flightsData);
    setAirlines(airlinesData);
  } catch (err) {
    console.error("[Dashboard] loadData error", err);
  } finally {
    if (firstLoad.current) {
      setLoading(false);
      firstLoad.current = false;
    }
  }
}
function openDelayPopover(flight) {
  setSelectedFlight(flight);
  setShowDelayModal(true);
}
function handleConfirmDelay(minutes) {
  // закрываем поповер в любом случае
  setShowDelayModal(false);

  if (!selectedFlight || !minutes || minutes <= 0) {
    return;
  }

  // реальный вызов обновления статуса с задержкой
  handleChangeStatus(selectedFlight, "delayed", minutes);
}


async function handleChangeStatus(flight, newStatus, manualDelayMinutes = 0) {
  try {
    setStatusUpdatingId(flight.id);

    const payload = { status: newStatus };

    // если это задержка и нам передали минуты — добавляем в payload
    if (newStatus === "delayed" && manualDelayMinutes > 0) {
  payload.delay_minutes = manualDelayMinutes;
}
    if (newStatus === "delayed" && manualDelayMinutes === 0) {
      setSelectedFlight(flight);
      setShowDelayModal(true);
      setStatusUpdatingId(null); 
      return;
    }

    await updateFlightStatus(flight.id, payload);

    // локально обновляем flights
    setFlights(prev =>
      prev.map(f => {
        if (f.id !== flight.id) return f;

        const updated = { ...f, status: newStatus };

        if (!f.original_departure_time) {
          updated.original_departure_time = f.departure_time;
          updated.original_arrival_time = f.arrival_time;
        }

        if (newStatus === "delayed" && manualDelayMinutes > 0) {
          const delayMs = manualDelayMinutes * 60 * 1000;

          updated.departure_time = new Date(
            new Date(f.departure_time).getTime() + delayMs
          ).toISOString();

          updated.arrival_time = new Date(
            new Date(f.arrival_time).getTime() + delayMs
          ).toISOString();
        }

        if (f.status === "delayed" && newStatus !== "delayed") {
          updated.departure_time =
            f.original_departure_time || f.departure_time;
          updated.arrival_time =
            f.original_arrival_time || f.arrival_time;
        }

        return updated;
      })
    );
  } catch (err) {
    console.error("Error updating flight status:", err);
    alert(err.message || "Ошибка обновления статуса рейса");
  } finally {
    setStatusUpdatingId(null);
  }
}
async function handleDeleteFlight(flight) {
  if (!window.confirm(`Удалить рейс ${flight.flight_number}?`)) return;

  try {
    await deleteFlight(flight.id);
    setFlights((prev) => prev.filter((f) => f.id !== flight.id));
  } catch (err) {
    console.error("Error deleting flight:", err);
    alert(err.message || "Ошибка удаления рейса");
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
            <div className="filters-bar">
  <input
    className="filter-input"
    type="text"
    placeholder="Поиск: номер, авиакомпания, аэропорт…"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />

  <input
    className="filter-date"
    type="date"
    value={filterDate}
    onChange={(e) => setFilterDate(e.target.value)}
  />

  <button
    type="button"
    className="btn-clear-filters"
    onClick={() => {
      setSearchQuery("");
      setFilterDate("");
    }}
  >
    Сброс
  </button>
</div>

              <div className="table-header">
                <div className="header-cell">Рейс</div>
                <div className="header-cell">Авиакомпания</div>
                <div className="header-cell">Маршрут</div>
                <div className="header-cell">Время</div>
                <div className="header-cell">Статус</div>
                {isAdmin && <div className="header-cell">Управление</div>}
              </div>

              <div className="table-body">
                {filteredFlights.map((flight) => (
                  <div key={flight.id} className="table-row">
                    <div className="table-cell flight-number">
                      {flight.flight_number}
                    </div>

                    <div className="table-cell airline">
                      <span className="airline-code">{flight.airline_code}</span>
                      <span className="airline-name">{flight.airline_name}</span>
                    </div>

                    <div className="table-cell route">
                        {/* первая строка – коды аэропортов */}
                        <div className="route-row">
                          <span className="airport">{flight.departure_airport}</span>
                          <span className="separator">→</span>
                          <span className="airport">{flight.arrival_airport}</span>
                        </div>

                        {/* вторая строка – города */}
                        <div className="route-row route-cities">
                          <span className="city">
                            {getCityByAirportCode(flight.departure_airport)}
                          </span>
                          <span className="separator">→</span>
                          <span className="city">
                            {getCityByAirportCode(flight.arrival_airport)}
                          </span>
                        </div>
                      </div>
                    <div className="table-cell time">
                    <div className="departure">
                      Вылет: {formatDateTimeRu(flight.departure_time)}
                    </div>
                    <div className="arrival">
                      Прилёт: {formatDateTimeRu(flight.arrival_time)}
                    </div>
                  </div>
                   <div className="table-cell status">
                  <span className={`status-badge status-${flight.status}`}>
                    {getStatusText(flight.status)}
                  </span>
                </div>
            
                    {isAdmin && (
                        <div className="table-cell actions">
                          <div className="status-control">
                            <select
                              value={flight.status || "scheduled"}
                              disabled={statusUpdatingId === flight.id}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (value === "delayed") {
                                  if (!canDelay(flight.status)) {
                                    alert("Нельзя ставить задержку: рейс уже в воздухе/приземлился/отменён.");
                                    return;
                                  }
                                  openDelayPopover(flight);
                                } else {
                                  handleChangeStatus(flight, value);
                                }
                              }}
                              className="status-select"
                            >
                              <option value="scheduled">По расписанию</option>
                              <option value="boarding">Посадка</option>
                              <option value="in_air">В полёте</option>
                              <option value="landed">Прибыл</option>
                             <option value="delayed" disabled={!canDelay(flight.status)}>
  Задержан
</option>
                              <option value="cancelled">Отменён</option>
                            </select>

                            {/* ОДНА модалка на строку */}
                            <DelayModal
                              isOpen={showDelayModal && selectedFlight?.id === flight.id}
                              onClose={() => setShowDelayModal(false)}
                              onConfirm={handleConfirmDelay}
                            />
                          </div>
                           <button
      type="button"
      className="btn-delete-flight"
      onClick={() => handleDeleteFlight(flight)}
      disabled={statusUpdatingId === flight.id}
    >
      Удалить рейс
    </button>
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

function formatDateTimeRu(dateString) {
  const date = new Date(dateString);

  const datePart = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} ${timePart}`;
}

