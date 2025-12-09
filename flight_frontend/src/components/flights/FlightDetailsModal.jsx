// src/components/flights/FlightDetailsModal.jsx
import React from "react";
import { getCityByAirportCode } from "../../utils/airports.js";

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Прибыл",
};

// простая справка авиакомпаний по коду
const AIRLINE_NAMES = {
  SU: "Аэрофлот",
  S7: "S7 Airlines",
  BA: "British Airways",
  EK: "Emirates",
  QR: "Qatar Airways",
  LH: "Lufthansa",
  AF: "Air France",
};

// и тип самолёта «по умолчанию» для красоты
const AIRCRAFT_TYPES = {
  SU: "Airbus A320",
  S7: "Airbus A321",
  BA: "Boeing 777-300ER",
  EK: "Airbus A380",
  QR: "Boeing 787-8",
  LH: "Airbus A350-900",
  AF: "Airbus A330-200",
};

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(departure, arrival) {
  if (!departure || !arrival) return null;

  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();

  if (Number.isNaN(diffMs) || diffMs <= 0) return null;

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} ч ${String(minutes).padStart(2, "0")} мин`;
}

export default function FlightDetailsModal({ flight, onClose }) {
  if (!flight) return null;

   const departureCity = getCityByAirportCode(flight.departure_airport);
  const arrivalCity = getCityByAirportCode(flight.arrival_airport);

  const airlineCode = (flight.airline_code || "").slice(0, 2).toUpperCase();

  const airlineName =
    flight.airline_name ||
    AIRLINE_NAMES[airlineCode] ||
    "Авиакомпания не указана";

  const aircraftType =
    flight.aircraft_type ||
    AIRCRAFT_TYPES[airlineCode] ||
    "Boeing 737-800 (по умолчанию)";

  const duration = formatDuration(
    flight.departure_time,
    flight.arrival_time
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-label">Рейс</div>
            <div className="modal-title">
              {flight.flight_number}
              {airlineCode && (
                <span className="modal-airline">
                  &nbsp;· {airlineCode}
                </span>
              )}
            </div>
            <div className="modal-airline-name">{airlineName}</div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>

        <div className="modal-grid">
          <div className="modal-block">
            <div className="modal-label">Маршрут</div>
            <div className="modal-value">
              {departureCity} ({flight.departure_airport}) →{" "}
      {arrivalCity} ({flight.arrival_airport})
            </div>
          </div>

          <div className="modal-block">
            <div className="modal-label">Статус</div>
            <div className={`modal-status status-${flight.status}`}>
              {STATUS_LABELS[flight.status] || flight.status}
            </div>
          </div>

          <div className="modal-block">
            <div className="modal-label">Вылет</div>
            <div className="modal-value">
              {formatDateTime(flight.departure_time)}
            </div>
          </div>

          <div className="modal-block">
            <div className="modal-label">Прилёт</div>
            <div className="modal-value">
              {formatDateTime(flight.arrival_time)}
            </div>
          </div>

          {duration && (
            <div className="modal-block">
              <div className="modal-label">Расчётное время полёта</div>
              <div className="modal-value">{duration}</div>
            </div>
          )}

          <div className="modal-block">
            <div className="modal-label">Тип самолёта</div>
            <div className="modal-value">{aircraftType}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
