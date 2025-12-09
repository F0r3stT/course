// src/components/flights/FlightSearchResults.jsx
import React from "react";
import { AIRPORT_TO_CITY } from "../../utils/airports";

export default function FlightSearchResults({ results = [] }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="search-results-container">
      <div className="results-header">
        <h4 className="results-title">
          Найдено рейсов: <span className="results-count">{results.length}</span>
        </h4>
      </div>
            <div className="search-results-list">
                {results.map((flight) => (
                    <div
                    key={flight.id}
                    className="search-result-card"
                    onClick={() => onSelectFlight && onSelectFlight(flight)}
                    >
                    {/* карточка рейса */}
                    </div>
                ))}
                </div>
      <div className="results-grid">
        {results.map((flight) => {
          const departureCity = AIRPORT_TO_CITY[flight.departure_airport] || flight.departure_airport;
          const arrivalCity = AIRPORT_TO_CITY[flight.arrival_airport] || flight.arrival_airport;
          
          return (
            <div key={flight.id} className="result-card">
              <div className="result-card-header">
                <span className="flight-number-large">{flight.flight_number}</span>
                <span className={`flight-status status-${flight.status}`}>
                  {getStatusText(flight.status)}
                </span>
              </div>

              <div className="result-card-route">
                <div className="route-from">
                  <div className="airport-code-large">{flight.departure_airport}</div>
                  <div className="city-name">{departureCity}</div>
                  <div className="flight-time">
                    {new Date(flight.departure_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="route-separator">
                  <div className="route-line"></div>
                  <div className="plane-icon">✈</div>
                </div>

                <div className="route-to">
                  <div className="airport-code-large">{flight.arrival_airport}</div>
                  <div className="city-name">{arrivalCity}</div>
                  <div className="flight-time">
                    {new Date(flight.arrival_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="result-card-footer">
                <div className="airline-info">
                  <span className="airline-code-small">{flight.airline_code}</span>
                  <span className="airline-name">{flight.airline_name || "Авиакомпания не указана"}</span>
                </div>
                <div className="flight-duration">
                  {Math.floor(flight.flight_duration_minutes / 60)}ч{" "}
                  {flight.flight_duration_minutes % 60}м
                </div>
              </div>
            </div>
          );
        })}
      </div>
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