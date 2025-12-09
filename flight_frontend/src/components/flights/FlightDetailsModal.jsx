// src/components/flights/FlightDetailsModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { getCityByAirportCode } from "../../utils/airports.js";
import { useFlightProgress } from '../../hooks/useFlightProgress';

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Прибыл",
};

const STATUS_COLORS = {
  scheduled: "#10b981",
  boarding: "#f59e0b",
  delayed: "#f97316",
  cancelled: "#ef4444",
  in_air: "#3b82f6",
  landed: "#8b5cf6",
};

const AIRLINE_LOGOS = {
  SU: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Aeroflot_Logo_ru.svg/240px-Aeroflot_Logo_ru.svg.png",
  S7: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/S7_new_logo.svg/240px-S7_new_logo.svg.png",
  BA: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/British_Airways_Logo.svg/240px-British_Airways_Logo.svg.png",
  EK: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/240px-Emirates_logo.svg.png",
  QR: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Qatar_Airways_Logo.svg/240px-Qatar_Airways_Logo.svg.png",
  LH: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Lufthansa_Logo.svg/240px-Lufthansa_Logo.svg.png",
  AF: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Air_France_Logo_%282009%29.svg/240px-Air_France_Logo_%282009%29.svg.png",
};

const AIRCRAFT_IMAGES = {
  "Airbus A320": "https://cdn-icons-png.flaticon.com/512/824/824239.png",
  "Airbus A321": "https://cdn-icons-png.flaticon.com/512/824/824239.png",
  "Boeing 737": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Boeing 777": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Boeing 787": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Embraer E190": "https://cdn-icons-png.flaticon.com/512/2014/2014909.png",
  "Sukhoi Superjet 100": "https://cdn-icons-png.flaticon.com/512/2014/2014909.png",
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

function formatTimeOnly(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFlightProgress(departure, arrival) {
  const now = new Date().getTime();
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  return ((now - start) / (end - start)) * 100;
}

function getTimeRemaining(departure, arrival) {
  const now = new Date();
  const end = new Date(arrival);
  
  if (now > end) return null;
  
  const diffMs = end.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours: diffHours, minutes: diffMinutes };
}

function getFlightDuration(departure, arrival) {
  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours: diffHours, minutes: diffMinutes };
}

function getAircraftImage(type) {
  for (const [key, image] of Object.entries(AIRCRAFT_IMAGES)) {
    if (type && type.includes(key.split(" ")[0])) {
      return image;
    }
  }
  return "https://cdn-icons-png.flaticon.com/512/2014/2014909.png";
}

export default function FlightDetailsModal({ flight, onClose }) {
  if (!flight) return null;

  const departureCity = getCityByAirportCode(flight.departure_airport);
  const arrivalCity = getCityByAirportCode(flight.arrival_airport);
  const airlineCode = (flight.airline_code || "").slice(0, 2).toUpperCase();
  const airlineLogo = AIRLINE_LOGOS[airlineCode];
  
    const { progress, timeRemaining } = useFlightProgress(
    flight.departure_time, 
    flight.arrival_time,
    flight.status === "in_air" // Только для активных рейсов
  );
  const flightDuration = getFlightDuration(flight.departure_time, flight.arrival_time);
  const aircraftImage = getAircraftImage(flight.aircraft_type);
  const statusColor = STATUS_COLORS[flight.status] || "#6b7280";

  // Анимация прогресса полёта
  useEffect(() => {
    if (flight.status !== "in_air") return;
    
    const interval = setInterval(() => {
      const newProgress = getFlightProgress(flight.departure_time, flight.arrival_time);
      setProgress(newProgress);
      
      const newTimeRemaining = getTimeRemaining(flight.departure_time, flight.arrival_time);
      setTimeRemaining(newTimeRemaining);
    }, 60000); // Обновление каждую минуту
    
    return () => clearInterval(interval);
  }, [flight.departure_time, flight.arrival_time, flight.status]);

  return (
    <div className="modern-modal-backdrop" onClick={onClose}>
      <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="modern-modal-header">
          <div className="flight-header-main">
            <div className="flight-number-large">
              <span className="flight-number-code">{flight.flight_number}</span>
              <span className="airline-code-badge">{airlineCode}</span>
            </div>
            <div className="flight-title">
              <h2>
                {departureCity.split("(")[0]} → {arrivalCity.split("(")[0]}
              </h2>
              <p className="flight-subtitle">
                {flight.airline_name || "Авиакомпания не указана"}
              </p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Статус и прогресс */}
        <div className="status-section">
          <div className="status-badge-large" style={{ backgroundColor: statusColor }}>
            {STATUS_LABELS[flight.status] || flight.status}
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: statusColor
                }}
              />
            </div>
            <div className="progress-label">
              {flight.status === "in_air" ? (
                timeRemaining ? (
                  <>До прибытия: {timeRemaining.hours}ч {timeRemaining.minutes}м</>
                ) : (
                  <>Прогресс полёта: {Math.round(progress)}%</>
                )
              ) : flight.status === "landed" ? (
                "Рейс завершён"
              ) : flight.status === "scheduled" ? (
                "Ожидается вылет"
              ) : (
                "Рейс задержан"
              )}
            </div>
          </div>
        </div>

        {/* Маршрут с анимированным самолётом */}
        <div className="route-section">
          <h3 className="card-title">Маршрут</h3>
          <div className="route-visual">
            {/* Аэропорт вылета */}
            <div className="airport-info departure">
              <div className="airport-code-large">{flight.departure_airport}</div>
              <div className="airport-city">{departureCity}</div>
              <div className="time-display">
                <span className="time-label">Вылет</span>
                <span className="time-value">{formatTimeOnly(flight.departure_time)}</span>
              </div>
            </div>

            {/* Линия маршрута с самолётом */}
            <div className="route-line-container">
              <div className="route-line">
                <div className="line-background"></div>
                <div 
                  className="plane-marker"
                  style={{ left: `${progress}%` }}
                >
                  <div className="plane-icon">✈</div>
                  <div className="plane-tooltip">
                    Пройдено: {Math.round(progress)}%
                  </div>
                </div>
                
                {/* Время в пути */}
                <div className="duration-display">
                  {flightDuration.hours}ч {flightDuration.minutes}м
                </div>
                
                {/* Маркеры времени */}
                <div className="time-marker start" style={{ left: "0%" }}>
                  <div className="marker-dot"></div>
                  <div className="marker-label">Вылет</div>
                </div>
                <div className="time-marker current" style={{ left: `${progress}%` }}>
                  <div className="marker-dot"></div>
                  <div className="marker-label">Сейчас</div>
                </div>
                <div className="time-marker end" style={{ left: "100%" }}>
                  <div className="marker-dot"></div>
                  <div className="marker-label">Прилёт</div>
                </div>
              </div>
              
              {/* Статус времени */}
              <div className="time-status">
                {flight.status === "in_air" ? (
                  <div className="time-remaining">
                    <span className="time-remaining-label">Осталось:</span>
                    <span className="time-remaining-value">
                      {timeRemaining ? `${timeRemaining.hours}ч ${timeRemaining.minutes}м` : "—"}
                    </span>
                  </div>
                ) : (
                  <div className="time-status-text">
                    {flight.status === "scheduled" ? "Рейс ожидает вылета" : 
                     flight.status === "landed" ? "Рейс завершён" : 
                     flight.status === "delayed" ? "Рейс задержан" : 
                     flight.status === "cancelled" ? "Рейс отменён" : 
                     "Рейс на посадке"}
                  </div>
                )}
              </div>
            </div>

            {/* Аэропорт прибытия */}
            <div className="airport-info arrival">
              <div className="airport-code-large">{flight.arrival_airport}</div>
              <div className="airport-city">{arrivalCity}</div>
              <div className="time-display">
                <span className="time-label">Прилёт</span>
                <span className="time-value">{formatTimeOnly(flight.arrival_time)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Детали рейса */}
        <div className="flight-info-grid">
          <div className="info-card details-card">
            <h3 className="card-title">Детали рейса</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Номер рейса:</span>
                <span className="detail-value">{flight.flight_number}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Авиакомпания:</span>
                <span className="detail-value">
                  {airlineLogo ? (
                    <div className="airline-display">
                      <img src={airlineLogo} alt={airlineCode} className="small-airline-logo" />
                      <span>{flight.airline_name}</span>
                    </div>
                  ) : (
                    flight.airline_name || "Не указана"
                  )}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Тип самолёта:</span>
                <span className="detail-value">
                  <div className="aircraft-display">
                    <img src={aircraftImage} alt="Aircraft" className="aircraft-icon" />
                    {flight.aircraft_type || "Не указан"}
                  </div>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Статус:</span>
                <span className="detail-value" style={{ color: statusColor }}>
                  {STATUS_LABELS[flight.status] || flight.status}
                </span>
              </div>
            </div>
          </div>

          <div className="info-card timeline-card">
            <h3 className="card-title">Хронология</h3>
            <div className="timeline-mini">
              <div className="timeline-item completed">
                <div className="timeline-dot" style={{ backgroundColor: statusColor }}></div>
                <div className="timeline-content">
                  <div className="timeline-time">{formatTimeOnly(flight.departure_time)}</div>
                  <div className="timeline-event">Вылет из {flight.departure_airport}</div>
                </div>
              </div>
              {(flight.status === "in_air" || flight.status === "landed") && (
                <div className="timeline-item active">
                  <div className="timeline-dot pulse" style={{ backgroundColor: statusColor }}></div>
                  <div className="timeline-content">
                    <div className="timeline-time">Сейчас</div>
                    <div className="timeline-event">В воздухе</div>
                  </div>
                </div>
              )}
              <div className={`timeline-item ${flight.status === "landed" ? "completed" : "upcoming"}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-time">{formatTimeOnly(flight.arrival_time)}</div>
                  <div className="timeline-event">Прилёт в {flight.arrival_airport}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="actions-section">
          <button className="action-button secondary">
            <span className="action-icon">📍</span>
            Отслеживание на карте
          </button>
          <button className="action-button ghost" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}