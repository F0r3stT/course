// src/components/flights/FlightsTable.jsx
import React, { useState, useMemo } from "react";
import "./FlightsTable.css";
import { AIRPORT_TO_CITY } from "../../utils/airports.js";

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Приземлился",
};

export default function FlightsTable({
  flights = [],
  loading,
  onSelectFlight,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // список авиакомпаний
  const airlineOptions = useMemo(() => {
    const codes = flights
      .map((f) => f.airline_code)
      .filter(Boolean)
      .filter((code, idx, arr) => arr.indexOf(code) === idx);
    return codes;
  }, [flights]);

  // фильтрация рейсов
  const filteredFlights = useMemo(() => {
    return flights
      .filter((flight) => {
        const depDate = new Date(flight.departure_time)
          .toISOString()
          .split("T")[0];
        const arrDate = new Date(flight.arrival_time)
          .toISOString()
          .split("T")[0];

        // по дате
        if (depDate !== dateFilter && arrDate !== dateFilter) return false;

        // по статусу
        if (statusFilter !== "all" && flight.status !== statusFilter) {
          return false;
        }

        // по авиакомпании
        if (airlineFilter !== "all" && flight.airline_code !== airlineFilter) {
          return false;
        }

        // строка поиска (номер рейса, коды, города, авиакомпания)
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const haystack = [
            flight.flight_number,
            flight.departure_airport,
            flight.arrival_airport,
            AIRPORT_TO_CITY[flight.departure_airport] || "",
            AIRPORT_TO_CITY[flight.arrival_airport] || "",
            flight.airline_name,
            flight.airline_code,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(s)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const tA = new Date(a.departure_time).getTime();
        const tB = new Date(b.departure_time).getTime();
        return tA - tB;
      });
  }, [flights, dateFilter, statusFilter, airlineFilter, searchTerm]);

  // утилиты отображения
  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusDisplay = (status) => {
    const classes = {
      scheduled: "status-scheduled",
      boarding: "status-boarding",
      in_air: "status-in-air",
      landed: "status-landed",
      delayed: "status-delayed",
      cancelled: "status-cancelled",
    };

    return {
      text: STATUS_LABELS[status] || status,
      className: classes[status] || "",
    };
  };

  return (
    <div className="modern-flight-board">
      {/* Заголовок + дата */}
      <div className="board-header">
        <div className="board-title-block">
          <h2 className="board-title">Расписание рейсов</h2>
          <span className="board-date">
            {new Date(dateFilter).toLocaleDateString("ru-RU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>


        <div className="board-controls">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-input date-input"
          />
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="board-filters">
        <div className="filter-group" style={{ flex: 2 }}>
          <label className="filter-label">Поиск</label>
          <div className="search-box">
            <input
              type="text"
              className="filter-input search-input"
              placeholder="Поиск по номеру рейса, городу или авиакомпании..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">Все статусы</option>
            <option value="scheduled">По расписанию</option>
            <option value="boarding">Посадка</option>
            <option value="in_air">В полёте</option>
            <option value="landed">Приземлился</option>
            <option value="delayed">Задержан</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Авиакомпания</label>
          <select
            value={airlineFilter}
            onChange={(e) => setAirlineFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">Все авиакомпании</option>
            {airlineOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Собственно табло (как на фото 2) */}
      <div className="flight-board-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Загрузка рейсов...</p>
          </div>
        ) : (
          <div className="flights-table">
            <table className="flights-table-content">
              <thead>
                <tr>
                  <th>№ РЕЙСА</th>
                  <th>АВИАКОМПАНИЯ</th>
                  <th>САМОЛЕТ</th>
                  <th>ОТКУДА</th>
                  <th>КУДА</th>
                  <th>ВЫЛЕТ</th>
                  <th>ПРИЛЕТ</th>
                  <th>СТАТУС</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlights.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      Рейсов не найдено. Измените параметры поиска или выберите
                      другую дату.
                    </td>
                  </tr>
                ) : (
                  filteredFlights.map((flight) => {
                    const statusInfo = getStatusDisplay(flight.status);
                    const departureCity =
                      AIRPORT_TO_CITY[flight.departure_airport] ||
                      flight.departure_airport;
                    const arrivalCity =
                      AIRPORT_TO_CITY[flight.arrival_airport] ||
                      flight.arrival_airport;

                    return (
                      <tr key={flight.id} className="flight-row" onClick={() => onSelectFlight && onSelectFlight(flight)}>
                        <td className="flight-number-cell">
                          <span className="flight-number">{flight.flight_number}</span>
                        </td>
                        <td className="airline-cell">
                          <div className="airline-info">
                            <span className="airline-code">
                              {flight.airline_code}
                            </span>
                            <span className="airline-name">
                              {flight.airline_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="aircraft-cell">
                          {flight.aircraft_type || "Не указан"}
                        </td>
                        <td className="city-cell">
                          <div className="city-info">
                            <span className="airport-code">
                              {flight.departure_airport}
                            </span>
                            <span className="city-name">{departureCity}</span>
                          </div>
                        </td>
                        <td className="city-cell">
                          <div className="city-info">
                            <span className="airport-code">
                              {flight.arrival_airport}
                            </span>
                            <span className="city-name">{arrivalCity}</span>
                          </div>
                        </td>
                        <td className="time-cell">
                          {formatTime(flight.departure_time)}
                        </td>
                        <td className="time-cell">
                          {formatTime(flight.arrival_time)}
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
