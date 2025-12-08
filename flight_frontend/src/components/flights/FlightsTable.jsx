// src/components/flights/FlightsTable.jsx
import React, { useState, useMemo } from "react";
import "./FlightsTable.css";

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Приземлился",
};

export default function FlightsTable({ flights = [], loading, onSelectFlight }) {
  const [activeTab, setActiveTab] = useState("departures"); // "departures" | "arrivals"
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // --- список авиакомпаний для фильтра ---
  const airlineOptions = useMemo(() => {
    const codes = flights
      .map((f) => f.airline_code)
      .filter(Boolean)
      .filter((code, idx, arr) => arr.indexOf(code) === idx);
    return codes;
  }, [flights]);

  // --- статистика по выбранной дате ---
  const stats = useMemo(() => {
    const sameDayFlights = flights.filter((flight) => {
      const timeStr =
        activeTab === "departures"
          ? flight.departure_time
          : flight.arrival_time;
      if (!timeStr) return false;
      const d = new Date(timeStr).toISOString().split("T")[0];
      return d === dateFilter;
    });

    return {
      total: sameDayFlights.length,
      scheduled: sameDayFlights.filter((f) => f.status === "scheduled").length,
      delayed: sameDayFlights.filter((f) => f.status === "delayed").length,
      inAir: sameDayFlights.filter((f) => f.status === "in_air").length,
      cancelled: sameDayFlights.filter((f) => f.status === "cancelled").length,
    };
  }, [flights, activeTab, dateFilter]);

  // --- основная фильтрация рейсов для табло ---
  const filteredFlights = useMemo(() => {
    return flights
      .filter((flight) => {
        // по дате (по вылету или прилёту в зависимости от вкладки)
        const timeStr =
          activeTab === "departures"
            ? flight.departure_time
            : flight.arrival_time;
        if (!timeStr) return false;

        const flightDate = new Date(timeStr).toISOString().split("T")[0];
        if (flightDate !== dateFilter) return false;

        // по статусу
        if (statusFilter !== "all" && flight.status !== statusFilter) {
          return false;
        }

        // по авиакомпании
        if (airlineFilter !== "all" && flight.airline_code !== airlineFilter) {
          return false;
        }

        // строка поиска
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const haystack = [
            flight.flight_number,
            flight.departure_airport,
            flight.arrival_airport,
            flight.airline_name,
            flight.airline_code,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(s)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const tA =
          activeTab === "departures"
            ? new Date(a.departure_time).getTime()
            : new Date(a.arrival_time).getTime();
        const tB =
          activeTab === "departures"
            ? new Date(b.departure_time).getTime()
            : new Date(b.arrival_time).getTime();
        return tA - tB;
      });
  }, [flights, activeTab, dateFilter, statusFilter, airlineFilter, searchTerm]);

  // --- утилиты отображения ---
  const formatTime = (dateString, withDate = false) => {
    if (!dateString) return "—";
    const date = new Date(dateString);

    if (withDate) {
      return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (dep, arr) => {
    if (!dep || !arr) return "—";
    const d = new Date(dep);
    const a = new Date(arr);
    const diff = a.getTime() - d.getTime();
    if (Number.isNaN(diff) || diff <= 0) return "—";

    const minutes = Math.round(diff / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}ч ${m}м`;
  };

  const getStatusDisplay = (status) => {
    const icons = {
      scheduled: "🟢",
      boarding: "🟡",
      in_air: "✈️",
      landed: "🟣",
      delayed: "🟠",
      cancelled: "🔴",
    };
    const classes = {
      scheduled: "status-scheduled",
      boarding: "status-boarding",
      in_air: "status-in-air",
      landed: "status-landed",
      delayed: "status-delayed",
      cancelled: "status-cancelled",
    };

    return {
      icon: icons[status] || "⚪",
      text: STATUS_LABELS[status] || status,
      className: classes[status] || "",
    };
  };

  // --- рендер ---
  return (
    <div className="modern-flight-board">
      {/* Вкладки "Вылеты / Прилёты" + дата */}
      <div className="board-header">
        <div className="header-tabs">
          <button
            className={`tab ${activeTab === "departures" ? "active" : ""}`}
            onClick={() => setActiveTab("departures")}
          >
            <span className="tab-icon">✈️</span>
            <span className="tab-text">Вылеты</span>
            <span className="tab-count">{stats.total}</span>
          </button>
          <button
            className={`tab ${activeTab === "arrivals" ? "active" : ""}`}
            onClick={() => setActiveTab("arrivals")}
          >
            <span className="tab-icon">🛬</span>
            <span className="tab-text">Прилёты</span>
            <span className="tab-count">{stats.total}</span>
          </button>
        </div>

        <div className="header-date">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="date-input"
          />
        </div>
      </div>

      {/* Поиск + быстрые фильтры по статусу */}
      <div className="quick-filters">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по номеру рейса, аэропорту или авиакомпании..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Все
          </button>
          <button
            className={`filter-btn ${
              statusFilter === "scheduled" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("scheduled")}
          >
            По расписанию
          </button>
          <button
            className={`filter-btn ${
              statusFilter === "delayed" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("delayed")}
          >
            Задержаны
          </button>
          <button
            className={`filter-btn ${
              statusFilter === "in_air" ? "active" : ""
            }`}
            onClick={() => setStatusFilter("in_air")}
          >
            В полёте
          </button>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Всего рейсов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">{stats.scheduled}</div>
            <div className="stat-label">По расписанию</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟠</div>
          <div className="stat-content">
            <div className="stat-value">{stats.delayed}</div>
            <div className="stat-label">Задержано</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✈️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inAir}</div>
            <div className="stat-label">В воздухе</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{stats.cancelled}</div>
            <div className="stat-label">Отменено</div>
          </div>
        </div>
      </div>

      {/* Список рейсов: номер, авиакомпания, маршрут, время, статус */}
      <div className="flight-board-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Загрузка рейсов...</p>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <h3>Рейсов не найдено</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="flight-list">
            <div className="flight-list-header">
              <div className="header-item time">
                {activeTab === "departures" ? "Вылет" : "Прилёт"}
              </div>
              <div className="header-item flight">Рейс / авиакомпания</div>
              <div className="header-item route">Маршрут</div>
              <div className="header-item status">Статус</div>
              <div className="header-item terminal">Терминал</div>
              <div className="header-item details" />
            </div>

            <div className="flight-list-body">
              {filteredFlights.map((flight) => {
                const statusInfo = getStatusDisplay(flight.status);

                return (
                  <div
                    key={flight.id}
                    className={`flight-item ${statusInfo.className}`}
                    onClick={() => onSelectFlight && onSelectFlight(flight)}
                  >
                    {/* Время и длительность */}
                    <div className="flight-cell time">
                      <div className="time-main">
                        {activeTab === "departures"
                          ? formatTime(flight.departure_time)
                          : formatTime(flight.arrival_time)}
                      </div>
                      <div className="time-duration">
                        {getDuration(flight.departure_time, flight.arrival_time)}
                      </div>
                    </div>

                    {/* Рейс + авиакомпания */}
                    <div className="flight-cell flight-info">
                      <div className="flight-number">
                        {flight.flight_number || "—"}
                      </div>
                      <div className="airline">
                        <span className="airline-code">
                          {flight.airline_code || "??"}
                        </span>
                        <span className="airline-name">
                          {flight.airline_name || "Авиакомпания не указана"}
                        </span>
                      </div>
                      <div className="aircraft">
                        {flight.aircraft_type || "Тип самолёта не указан"}
                      </div>
                    </div>

                    {/* Маршрут: откуда / куда + точное время */}
                    <div className="flight-cell route">
                      <div className="route-container">
                        <div className="airport departure">
                          <div className="airport-code">
                            {flight.departure_airport}
                          </div>
                          <div className="airport-time">
                            {formatTime(flight.departure_time, true)}
                          </div>
                        </div>
                        <div className="route-line">
                          <div className="line" />
                          <div className="plane-icon">✈️</div>
                        </div>
                        <div className="airport arrival">
                          <div className="airport-code">
                            {flight.arrival_airport}
                          </div>
                          <div className="airport-time">
                            {formatTime(flight.arrival_time, true)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Статус */}
                    <div className="flight-cell status">
                      <div
                        className={`status-indicator ${statusInfo.className}`}
                      >
                        <span className="status-icon">{statusInfo.icon}</span>
                        <span className="status-text">{statusInfo.text}</span>
                      </div>
                    </div>

                    {/* Терминал/гейт — пока заглушка */}
                    <div className="flight-cell terminal">
                      <div className="terminal-info">
                        <span className="gate">{flight.gate || "—"}</span>
                        <span className="terminal-label">
                          {flight.terminal || "Терминал не указан"}
                        </span>
                      </div>
                    </div>

                    {/* Стрелка деталей */}
                    <div className="flight-cell details">
                      <button className="details-btn" type="button">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Нижняя панель с информацией */}
      <div className="board-info-panel">
        <div className="info-panel-content">
          <div className="info-item">
            <span className="info-label">Обновлено:</span>
            <span className="info-value">
              {new Date().toLocaleTimeString("ru-RU")}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Показано:</span>
            <span className="info-value">
              {filteredFlights.length} рейсов
            </span>
          </div>
          <div className="info-actions">
            <button className="action-btn" type="button">
              Экспорт
            </button>
            <button
              className="action-btn refresh"
              type="button"
              onClick={() => window.location.reload()}
            >
              Обновить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
