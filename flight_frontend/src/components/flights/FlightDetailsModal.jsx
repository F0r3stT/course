// src/components/flights/FlightDetailsModal.jsx
import React from "react";
import { getCityByAirportCode } from "../../utils/airports.js";
import { useFlightProgress } from "../../hooks/useFlightProgress";
import "./FlightDetailsModal.css";

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

const AIRCRAFT_IMAGES = {
  "Airbus A320": "https://cdn-icons-png.flaticon.com/512/824/824239.png",
  "Airbus A321": "https://cdn-icons-png.flaticon.com/512/824/824239.png",
  "Boeing 737": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Boeing 777": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Boeing 787": "https://cdn-icons-png.flaticon.com/512/2972/2972545.png",
  "Embraer E190": "https://cdn-icons-png.flaticon.com/512/2014/2014909.png",
  "Sukhoi Superjet 100": "https://cdn-icons-png.flaticon.com/512/2014/2014909.png",
};

function formatTimeOnly(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function getFlightDuration(departure, arrival) {
  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours: diffHours, minutes: diffMinutes };
}

function getAircraftImage(type) {
  if (!type) {
    return "https://cdn-icons-png.flaticon.com/512/2014/2014909.png";
  }

  for (const [key, image] of Object.entries(AIRCRAFT_IMAGES)) {
    if (type.includes(key.split(" ")[0])) {
      return image;
    }
  }

  return "https://cdn-icons-png.flaticon.com/512/2014/2014909.png";
}

export default function FlightDetailsModal({ flight, onClose }) {
  if (!flight) return null;

  const departureCityFull =
    getCityByAirportCode(flight.departure_airport) || flight.departure_airport;
  const arrivalCityFull =
    getCityByAirportCode(flight.arrival_airport) || flight.arrival_airport;

  // Красивое название города без кода в скобках
  const departureCity = departureCityFull.split("(")[0].trim();
  const arrivalCity = arrivalCityFull.split("(")[0].trim();

  const airlineCode = (flight.airline_code || "").slice(0, 2).toUpperCase();

  const { progress, timeRemaining } = useFlightProgress(
    flight.departure_time,
    flight.arrival_time,
    flight.status
  );

  const flightDuration = getFlightDuration(
    flight.departure_time,
    flight.arrival_time
  );
  const aircraftImage = getAircraftImage(flight.aircraft_type);
    const totalMinutesRemaining =
    timeRemaining != null
      ? timeRemaining.hours * 60 + timeRemaining.minutes
      : null;


  let visualStatus = flight.status;

  if (
    flight.status === "in_air" &&
    totalMinutesRemaining != null &&
    totalMinutesRemaining > 0 &&
    totalMinutesRemaining <= 15
  ) {
    visualStatus = "boarding"; 
  }

  const statusColor = STATUS_COLORS[visualStatus] || "#6b7280";

  // Визуальный прогресс по линии
  const visualProgressRaw =
    flight.status === "landed"
      ? 100
      : flight.status === "scheduled"
      ? 0
      : progress || 0;

  const visualProgress = Math.min(100, Math.max(0, visualProgressRaw));

  // Генерация временной шкалы в зависимости от статуса
  const getTimelineItems = () => {
    const now = new Date();
    const departureTime = new Date(flight.departure_time);
    const arrivalTime = new Date(flight.arrival_time);
    const items = [];


    // Регистрация (за 2 часа до вылета)
    const checkinTime = new Date(departureTime.getTime() - 2 * 60 * 60 * 1000);
    items.push({
      time: formatDateTime(checkinTime),
      event: "Начало регистрации",
      status: now >= checkinTime ? "completed" : "upcoming",
      icon: "🏷️"
    });

    // Посадка (за 40 минут до вылета)
    const boardingTime = new Date(departureTime.getTime() - 40 * 60 * 1000);
    items.push({
      time: formatDateTime(boardingTime),
      event: "Начало посадки",
      status: flight.status === "boarding" ? "active" : 
             now >= boardingTime ? "completed" : "upcoming",
      icon: "👥"
    });

    // Вылет
    items.push({
      time: formatDateTime(flight.departure_time),
      event: `Вылет из ${flight.departure_airport}`,
      status: flight.status === "in_air" || flight.status === "landed" ? "completed" : 
             flight.status === "delayed" ? "delayed" : "upcoming",
      icon: "✈️",
      description: departureCityFull
    });

    // В пути (только для in_air) - упрощенная версия
    if (flight.status === "in_air") {
      items.push({
        time: "Сейчас",
        event: "В воздухе",
        status:
          totalMinutesRemaining != null && totalMinutesRemaining <= 15
            ? "completed" // когда уже идёт посадка
            : "active",
        icon: "🌤️"
      });
    }
    const landingApproachTime = new Date(
      arrivalTime.getTime() - 15 * 60 * 1000
    );
    items.push({
      time: formatDateTime(landingApproachTime),
      event: `Приземление в ${flight.arrival_airport}`,
      status:
        flight.status === "landed"
          ? "completed"
          : totalMinutesRemaining != null && totalMinutesRemaining <= 15
          ? "active"
          : now >= landingApproachTime
          ? "completed"
          : "upcoming",
      icon: "🛬",
      description: arrivalCityFull
    });

    // Прибытие
    items.push({
      time: formatDateTime(flight.arrival_time),
      event: `Прибытие в ${flight.arrival_airport}`,
      status: flight.status === "landed" ? "completed" : "upcoming",
      icon: "🛬",
      description: arrivalCityFull
    });

    return items;
  };

  const timelineItems = getTimelineItems();

  return (
    <div className="modern-modal-backdrop" onClick={onClose}>
      <div
        className="modern-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="modern-modal-header">
          <div className="flight-header-main">
            <div className="flight-number-large">
              <span className="flight-number-code">{flight.flight_number}</span>
              <span className="airline-code-badge">{airlineCode}</span>
            </div>
            <div className="flight-title">
              <h2>
                <span className="city-name-white">{departureCity}</span> → <span className="city-name-white">{arrivalCity}</span>
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

                {/* Статус + общий прогресс */}
        {/* Полноширинный статус */}
<div 
  className="status-fullwidth" 
  style={{ backgroundColor: statusColor }}
>
  <div className="status-fullwidth-content">
    <span className="status-fullwidth-text">
      {STATUS_LABELS[visualStatus] || visualStatus}
    </span>
  </div>
</div>

        {/* Маршрут: от аэропорта вылета до аэропорта прибытия */}
        <div className="route-section">
          <h3 className="card-title">Маршрут</h3>
          <div className="route-visual-simple">
            {/* ЛЕВЫЙ БЛОК – ОТКУДА */}
            <div className="airport-info departure">
              <div className="airport-code-large white-text">
                {flight.departure_airport}
              </div>
              <div className="airport-city white-text">{departureCityFull}</div>
              <div className="time-display">
                <span className="time-label white-text">Вылет</span>
                <span className="time-value white-text">
                  {formatTimeOnly(flight.departure_time)}
                </span>
              </div>
            </div>

            {/* СРЕДНЯЯ ПОЛОСА – ПРОГРЕСС БАР */}
            <div className="route-line-simple">
              <div className="simple-progress-bar">
                <div className="simple-progress-fill" style={{ width: `${visualProgress}%` }} />
              </div>
              
              {/* Текст под прогресс-баром */}
              <div className="route-middle-info">
                <div className="remaining-time">
                  <span className="remaining-label white-text">Осталось:</span>
                  <span className="remaining-value white-text">
                    {flight.status === "in_air" && timeRemaining
                      ? `${timeRemaining.hours}ч ${timeRemaining.minutes}м`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* ПРАВЫЙ БЛОК – КУДА */}
            <div className="airport-info arrival">
              <div className="airport-code-large white-text">
                {flight.arrival_airport}
              </div>
              <div className="airport-city white-text">{arrivalCityFull}</div>
              <div className="time-display">
                <span className="time-label white-text">Прилёт</span>
                <span className="time-value white-text">
                  {formatTimeOnly(flight.arrival_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Компактная полоса статистики по маршруту */}
          <div className="route-stats-strip-simple">
            <div className="route-stat-simple route-stat--from">
              <span className="route-stat-label-simple">Вылет</span>
              <span className="route-stat-value-simple">
                {formatTimeOnly(flight.departure_time)}
              </span>
              <span className="route-stat-hint-simple white-text">
                {flight.departure_airport} · {departureCity}
              </span>
            </div>

            <div className="route-stat-simple route-stat--middle">
              <span className="route-stat-label-simple">В пути</span>
              <span className="route-stat-value-simple">
                {flightDuration.hours}ч {flightDuration.minutes}м
              </span>
              <span className="route-stat-hint-simple white-text">
                Пройдено {Math.round(visualProgress)}%
              </span>
            </div>

            <div className="route-stat-simple route-stat--to">
              <span className="route-stat-label-simple">
                {flight.status === "in_air" ? "Осталось" : "Прибытие"}
              </span>
              <span className="route-stat-value-simple">
                {flight.status === "in_air" && timeRemaining
                  ? `${timeRemaining.hours}ч ${timeRemaining.minutes}м`
                  : formatTimeOnly(flight.arrival_time)}
              </span>
              <span className="route-stat-hint-simple white-text">
                {flight.arrival_airport} · {arrivalCity}
              </span>
            </div>
          </div>
        </div>

        {/* Детали рейса + хронология */}
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
                  {flight.airline_name || "Не указана"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Тип самолёта:</span>
                <span className="detail-value">
                  <div className="aircraft-display">
                    <img
                      src={aircraftImage}
                      alt="Aircraft"
                      className="aircraft-icon"
                    />
                    {flight.aircraft_type || "Не указан"}
                  </div>
                </span>
              </div>
              <div className="detail-item">
  <span className="detail-label">
    {flight.status === "landed" ? "Время полёта:" : "Примерное время:"}
  </span>
  <span className="detail-value flight-duration-value">
    {flightDuration.hours}ч {flightDuration.minutes}м
  </span>
</div>
            </div>
          </div>

          <div className="info-card timeline-card">
            <h3 className="card-title">Хронология рейса</h3>
            <div className="timeline-detailed-simple">
              {timelineItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`timeline-item-simple ${item.status}`}
                >
                  <div className="timeline-icon-simple">{item.icon}</div>
                  <div className="timeline-content-simple">
                    <div className="timeline-header-simple">
                      <span className="timeline-time-simple">{item.time}</span>
                      <span className={`timeline-status-simple ${item.status}`}>
                        {item.status === "completed" ? "✓ Выполнено" : 
                         item.status === "active" ? "⏳ Сейчас" : 
                         item.status === "delayed" ? "⚠ Задержка" : "⏱ Ожидается"}
                      </span>
                    </div>
                    <div className="timeline-event-simple">{item.event}</div>
                    {item.description && (
                      <div className="timeline-description-simple">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}