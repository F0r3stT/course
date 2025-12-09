// src/components/flights/CreateFlightTab.jsx
import React, { useState, useEffect } from "react";
import { createFlight } from "../../api/flightsApi";
import { AIRPORT_TO_CITY } from "../../utils/airports";
const KNOWN_AIRPORT_CODES = Object.keys(AIRPORT_TO_CITY);

const STATUS_OPTIONS = [
  { value: "scheduled", label: "По расписанию" },
  { value: "boarding", label: "Посадка" },
  { value: "delayed", label: "Задержан" },
  { value: "cancelled", label: "Отменён" },
  { value: "in_air", label: "В полёте" },
  { value: "landed", label: "Прибыл" },
];

const AIRLINE_OPTIONS = [
  { code: "SU", name: "Аэрофлот" },
  { code: "S7", name: "S7 Airlines" },
  { code: "U6", name: "Уральские авиалинии" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "LH", name: "Lufthansa" },
  { code: "BA", name: "British Airways" },
  { code: "EK", name: "Emirates" },
];

const AIRCRAFT_OPTIONS = [
  "Airbus A320",
  "Airbus A321",
  "Airbus A330",
  "Airbus A350",
  "Boeing 737-800",
  "Boeing 777",
  "Boeing 787",
  "Embraer E190",
  "Sukhoi Superjet 100",
  "Иркут МС-21",
];

export default function CreateFlightTab({ onFlightCreated }) {
  const [formData, setFormData] = useState({
    flightNumber: "",
    airlineCode: "SU",
    airlineName: "Аэрофлот",
    aircraftType: "Airbus A320",
    departureAirport: "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    status: "scheduled",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Устанавливаем время по умолчанию (текущее + 2 часа для вылета, +4 для прилёта)
    const now = new Date();
    const departure = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + 2 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      departureTime: formatDateTimeLocal(departure),
      arrivalTime: formatDateTimeLocal(arrival),
    }));
  }, []);

  const handleAirlineChange = (code) => {
    const airline = AIRLINE_OPTIONS.find(a => a.code === code);
    setFormData(prev => ({
      ...prev,
      airlineCode: code,
      airlineName: airline?.name || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (!formData.airlineCode) {
  throw new Error("Выберите авиакомпанию");
}

    try {
      // Валидация
      if (!formData.flightNumber || !/^\d+$/.test(formData.flightNumber)) {
        throw new Error("Введите корректный номер рейса (только цифры)");
      }
      
      if (!formData.departureAirport || formData.departureAirport.length !== 3) {
        throw new Error("Введите корректный код аэропорта вылета (3 буквы)");
      }
      
      if (!formData.arrivalAirport || formData.arrivalAirport.length !== 3) {
        throw new Error("Введите корректный код аэропорта прилёта (3 буквы)");
      }
      
      if (formData.departureAirport === formData.arrivalAirport) {
        throw new Error("Аэропорты вылета и прилёта не могут совпадать");
      }
      
      if (!formData.departureTime || !formData.arrivalTime) {
        throw new Error("Заполните время вылета и прилёта");
      }
      
      const departureTime = new Date(formData.departureTime);
      const arrivalTime = new Date(formData.arrivalTime);
      
      if (arrivalTime <= departureTime) {
        throw new Error("Время прилёта должно быть позже времени вылета");
      }
            const isValidAirport = (code) =>
            KNOWN_AIRPORT_CODES.includes((code || "").toUpperCase());

            if (!isValidAirport(formData.departureAirport) || !isValidAirport(formData.arrivalAirport)) {
            alert("Укажите существующие коды аэропортов (например, SVO, DME, LED)");
            return;
            }
      // Подготовка данных для API
      const flightToCreate = {
        flight_number: formData.flightNumber,
        airline_code: formData.airlineCode,
        airline_name: formData.airlineName,
        aircraft_type: formData.aircraftType,
        departure_airport: formData.departureAirport.toUpperCase(),
  arrival_airport: formData.arrivalAirport.toUpperCase(),
        departure_time: departureTime.toISOString(),
        arrival_time: arrivalTime.toISOString(),
        status: formData.status,
      };

      const createdFlight = await createFlight(flightToCreate);
      
      setSuccess(`Рейс ${createdFlight.flight_number} успешно создан!`);
      
      // Сброс формы
      setFormData({
        flightNumber: "",
        airlineCode: "SU",
        airlineName: "Аэрофлот",
        aircraftType: "Airbus A320",
        departureAirport: "",
        arrivalAirport: "",
        departureTime: formatDateTimeLocal(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)),
        arrivalTime: formatDateTimeLocal(new Date(new Date().getTime() + 4 * 60 * 60 * 1000)),
        status: "scheduled",
      });

      if (onFlightCreated) {
        onFlightCreated(createdFlight);
      }

    } catch (err) {
      console.error("Ошибка создания рейса:", err);
      setError(err.message || "Ошибка при создании рейса");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="create-flight-tab">
      <div className="create-flight-header">
        <h2 className="tab-title">Создание нового рейса</h2>
        <p className="tab-subtitle">Заполните все поля для добавления рейса в систему</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-flight-form">
        {/* Блок: номер рейса и авиакомпания */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Номер рейса *
              <input
                type="text"
                value={formData.flightNumber}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  flightNumber: e.target.value.replace(/\D/g, '') 
                }))}
                placeholder="Например: 1234"
                className="form-input"
                maxLength={6}
                required
              />
              <small className="form-hint">Только цифры, до 6 символов</small>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Авиакомпания *
              <select
                value={formData.airlineCode}
                onChange={(e) => handleAirlineChange(e.target.value)}
                className="form-select"
                required
              >
                {AIRLINE_OPTIONS.map(airline => (
                  <option key={airline.code} value={airline.code}>
                    {airline.code} - {airline.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Тип самолёта *
              <select
                value={formData.aircraftType}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  aircraftType: e.target.value 
                }))}
                className="form-select"
                required
              >
                {AIRCRAFT_OPTIONS.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Блок: маршрут */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Аэропорт вылета *
              <input
                type="text"
                value={formData.departureAirport}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  departureAirport: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') 
                }))}
                placeholder="SVO"
                className="form-input"
                maxLength={3}
                required
              />
              <small className="form-hint">Код IATA (3 буквы)</small>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Аэропорт прилёта *
              <input
                type="text"
                value={formData.arrivalAirport}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  arrivalAirport: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') 
                }))}
                placeholder="LED"
                className="form-input"
                maxLength={3}
                required
              />
              <small className="form-hint">Код IATA (3 буквы)</small>
            </label>
          </div>
        </div>

        {/* Блок: время */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              Время вылета *
              <input
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  departureTime: e.target.value 
                }))}
                className="form-input"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Время прилёта *
              <input
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  arrivalTime: e.target.value 
                }))}
                className="form-input"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Статус рейса *
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  status: e.target.value 
                }))}
                className="form-select"
                required
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Блок: кнопки */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                Создание...
              </>
            ) : (
              "Создать рейс"
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              // Сброс формы
              setFormData({
                flightNumber: "",
                airlineCode: "SU",
                airlineName: "Аэрофлот",
                aircraftType: "Airbus A320",
                departureAirport: "",
                arrivalAirport: "",
                departureTime: formatDateTimeLocal(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)),
                arrivalTime: formatDateTimeLocal(new Date(new Date().getTime() + 4 * 60 * 60 * 1000)),
                status: "scheduled",
              });
              setError("");
              setSuccess("");
            }}
          >
            Очистить форму
          </button>
        </div>
      </form>
    </div>
  );
}