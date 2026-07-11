import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import AirportSelector from "../components/flights/AirportSelector.jsx";
import FlightDetailsModal from "../components/flights/FlightDetailsModal.jsx";
import { fetchFlights } from "../api/flightsApi.js";

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  in_air: "В полёте",
  landed: "Приземлился",
  delayed: "Задержан",
  cancelled: "Отменён",
};

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState(null);

  // При загрузке страницы читаем критерии из URL (?search=...)
  useEffect(() => {
    const raw = searchParams.get("search");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.departure || parsed.arrival)) {
        handleSearch(parsed);
      }
    } catch (e) {
      console.warn("[FlightsPage] invalid search param:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // только при первом монтировании

  const handleSearch = async ({ departure, arrival }) => {
    const dep = (departure || "").trim().toUpperCase();
    const arr = (arrival || "").trim().toUpperCase();

    // сохраняем критерии в URL
    setSearchParams({
      search: JSON.stringify({ departure: dep, arrival: arr }),
    });

    setError("");
    setLoading(true);
    setFlights([]);

    try {
      const allFlights = await fetchFlights(); // запрос к /api/flights
      const filtered = allFlights.filter((f) => {
        const fDep = (f.departure_airport || "").toUpperCase();
        const fArr = (f.arrival_airport || "").toUpperCase();

        return (!dep || fDep === dep) && (!arr || fArr === arr);
      });

      setFlights(filtered);
    } catch (err) {
      console.error("[FlightsPage] search error:", err);
      setError(err.message || "Ошибка поиска рейсов");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1>Поиск рейсов</h1>

      {/* Форма поиска */}
      <div className="search-card" style={{ marginBottom: "2rem" }}>
        <AirportSelector onSearch={handleSearch} />
      </div>

      {/* Состояния загрузки/ошибки */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Загрузка рейсов...</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <p style={{ color: "red" }}>{error}</p>
        </div>
      )}

      {!loading && !error && flights.length === 0 && (
        <div className="empty-state">
          <p>Используйте форму выше для поиска рейсов.</p>
          <p className="hint">Примеры: SVO → LED, DME → VKO, SVO → TOM</p>
        </div>
      )}

      {/* Найденные рейсы */}
      {!loading && !error && flights.length > 0 && (
        <div className="flights-grid">
          {flights.map((flight) => {
            const duration = flight.flight_duration_minutes;
            const airlineCode = (flight.airline_code || "").toUpperCase();
            const airlineName = flight.airline_name || "";

            return (
              <div
                key={flight.id}
                className="flight-card search-result-card"
                onClick={() => setSelectedFlight(flight)}
                style={{ cursor: "pointer" }}
              >
                <div className="flight-header">
                  <div>
                    <div className="flight-number-large">
                      Рейс {flight.flight_number}
                    </div>
                    <div className="flight-airline">
                      {airlineName
                        ? `${airlineName} (${airlineCode || "—"})`
                        : airlineCode || "—"}
                    </div>
                  </div>
                  <span
                    className={`flight-status status-${flight.status || "scheduled"}`}
                  >
                    {STATUS_LABELS[flight.status] || flight.status || "—"}
                  </span>
                </div>

                <div className="flight-route">
                  <div className="route-segment">
                    <span className="airport-code">
                      {flight.departure_airport}
                    </span>
                    <span className="city">{flight.departure_city}</span>
                    <span className="time">
                      {formatTime(flight.departure_time)}
                    </span>
                  </div>

                  <div className="route-line">
                    <div className="line" />
                    <div className="plane-icon">✈</div>
                  </div>

                  <div className="route-segment">
                    <span className="airport-code">
                      {flight.arrival_airport}
                    </span>
                    <span className="city">{flight.arrival_city}</span>
                    <span className="time">
                      {formatTime(flight.arrival_time)}
                    </span>
                  </div>
                </div>

                <div className="flight-footer">
                  <span className="duration">
                    {duration
                      ? `${Math.floor(duration / 60)} ч ${duration % 60} м`
                      : "—"}
                  </span>
                  <span className="flight-id">ID: {flight.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно с подробностями */}
      <FlightDetailsModal
        flight={selectedFlight}
        onClose={() => setSelectedFlight(null)}
      />
    </div>
  );
}
