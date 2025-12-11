import React, { useState, useEffect } from "react";
import { createFlight } from "../../api/flightsApi";
import { AIRPORT_TO_CITY, getFlightDurationMinutes } from "../../utils/airports";
import "./CreateFlightTab.css";

const KNOWN_AIRPORT_CODES = Object.keys(AIRPORT_TO_CITY);

// Минимальное время полёта между городами (в часах)
const MIN_FLIGHT_TIMES = {
  // Россия
  "MOW-LED": 1.5,   // Москва - Санкт-Петербург
  "MOW-AER": 2,     // Москва - Сочи
  "MOW-SVX": 2.5,   // Москва - Екатеринбург
  "MOW-KJA": 4.5,   // Москва - Красноярск
  "MOW-OVB": 4,     // Москва - Новосибирск
  "MOW-KHV": 9,     // Москва - Хабаровск
  "MOW-VVO": 10,    // Москва - Владивосток
  
  // Международные
  "MOW-IST": 3.5,   // Москва - Стамбул
  "MOW-LHR": 4,     // Москва - Лондон
  "MOW-JFK": 10,    // Москва - Нью-Йорк
  "LED-IST": 3,     // Санкт-Петербург - Стамбул
  "LED-LHR": 3.5,   // Санкт-Петербург - Лондон
};

const STATUS_OPTIONS = [
  { value: "scheduled", label: "По расписанию", icon: "📅" },
  { value: "boarding", label: "Посадка", icon: "👥" },
  { value: "delayed", label: "Задержан", icon: "⏱️" },
  { value: "cancelled", label: "Отменён", icon: "❌" },
  { value: "in_air", label: "В полёте", icon: "✈️" },
  { value: "landed", label: "Прибыл", icon: "🛬" },
];

const AIRLINE_OPTIONS = [
  { code: "SU", name: "Аэрофлот", color: "#004d99" },
  { code: "S7", name: "S7 Airlines", color: "#008c45" },
  { code: "U6", name: "Уральские авиалинии", color: "#003366" },
  { code: "TK", name: "Turkish Airlines", color: "#c60c30" },
  { code: "LH", name: "Lufthansa", color: "#1c1c1c" },
  { code: "BA", name: "British Airways", color: "#0755a5" },
  { code: "EK", name: "Emirates", color: "#d71921" },
  { code: "FV", name: "Россия", color: "#0039a6" },
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

// Получить минимальное время полёта между аэропортами
function getMinFlightHours(depCode, arrCode) {
  // Проверяем прямое соответствие
  const directKey = `${depCode}-${arrCode}`;
  if (MIN_FLIGHT_TIMES[directKey]) {
    return MIN_FLIGHT_TIMES[directKey];
  }
  
  // Проверяем обратное направление
  const reverseKey = `${arrCode}-${depCode}`;
  if (MIN_FLIGHT_TIMES[reverseKey]) {
    return MIN_FLIGHT_TIMES[reverseKey];
  }
  
  // Для неизвестных маршрутов используем эвристику
  // Если это внутренний рейс в России
  const depCountry = depCode === 'MOW' || depCode === 'LED' || depCode === 'SVX' || 
                     depCode === 'KJA' || depCode === 'OVB' || depCode === 'KHV' || 
                     depCode === 'VVO' ? 'RU' : 'INT';
  const arrCountry = arrCode === 'MOW' || arrCode === 'LED' || arrCode === 'SVX' || 
                     arrCode === 'KJA' || depCode === 'OVB' || depCode === 'KHV' || 
                     arrCode === 'VVO' ? 'RU' : 'INT';
  
  if (depCountry === 'RU' && arrCountry === 'RU') {
    // Внутренние рейсы в России
    return 1.5;
  } else if (depCountry === 'RU' || arrCountry === 'RU') {
    // Международные рейсы из/в Россию
    return 3;
  } else {
    // Международные рейсы между другими странами
    return 2;
  }
}

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

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // Флаг для отображения ошибок после первой попытки отправки
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const now = new Date();
    const departure = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + 3 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      departureTime: formatDateTimeLocal(departure),
      arrivalTime: formatDateTimeLocal(arrival),
    }));
  }, []);

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};

    // Номер рейса
    if (!formData.flightNumber) {
      newErrors.flightNumber = "Обязательное поле";
    } else if (!/^\d{3,6}$/.test(formData.flightNumber)) {
      newErrors.flightNumber = "Только цифры, от 3 до 6 символов";
    }

    // Аэропорт вылета
    if (!formData.departureAirport) {
      newErrors.departureAirport = "Обязательное поле";
    } else if (formData.departureAirport.length !== 3) {
      newErrors.departureAirport = "Код IATA должен быть 3 буквы";
    } else if (!KNOWN_AIRPORT_CODES.includes(formData.departureAirport.toUpperCase())) {
      newErrors.departureAirport = "Неизвестный код аэропорта";
    }

    // Аэропорт прилёта
    if (!formData.arrivalAirport) {
      newErrors.arrivalAirport = "Обязательное поле";
    } else if (formData.arrivalAirport.length !== 3) {
      newErrors.arrivalAirport = "Код IATA должен быть 3 буквы";
    } else if (!KNOWN_AIRPORT_CODES.includes(formData.arrivalAirport.toUpperCase())) {
      newErrors.arrivalAirport = "Неизвестный код аэропорта";
    } else if (formData.departureAirport && 
               formData.departureAirport.toUpperCase() === formData.arrivalAirport.toUpperCase()) {
      newErrors.arrivalAirport = "Аэропорты не могут совпадать";
    }

    // Время вылета
    if (!formData.departureTime) {
      newErrors.departureTime = "Обязательное поле";
    }

    // Время прилёта
    if (!formData.arrivalTime) {
      newErrors.arrivalTime = "Обязательное поле";
    } else if (formData.departureTime && formData.arrivalTime) {
      const departureTime = new Date(formData.departureTime);
      const arrivalTime = new Date(formData.arrivalTime);
      
      if (arrivalTime <= departureTime) {
        newErrors.arrivalTime = "Время прилёта должно быть позже вылета";
      } else {
        // Проверка минимального времени полёта
        const flightHours = (arrivalTime - departureTime) / (1000 * 60 * 60);
        const minHours = getMinFlightHours(
          formData.departureAirport.toUpperCase(),
          formData.arrivalAirport.toUpperCase()
        );
        
        if (flightHours < minHours) {
          newErrors.arrivalTime = `Слишком мало времени для полёта. Минимум: ${minHours} часов`;
        }
      }
    }

    return newErrors;
  };

  const handleAirlineChange = (code) => {
    const airline = AIRLINE_OPTIONS.find(a => a.code === code);
    setFormData(prev => ({
      ...prev,
      airlineCode: code,
      airlineName: airline?.name || "",
    }));
  };

  const handleAirportChange = (field, value) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z]/g, '');
    setFormData(prev => ({ ...prev, [field]: upperValue }));
    
    // Автоматически показываем город при вводе кода
    if (upperValue.length === 3 && KNOWN_AIRPORT_CODES.includes(upperValue)) {
      const city = AIRPORT_TO_CITY[upperValue];
      // Можно добавить уведомление или подсказку
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      flightNumber: true,
      departureAirport: true,
      arrivalAirport: true,
      departureTime: true,
      arrivalTime: true,
    });

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const flightToCreate = {
        flight_number: formData.flightNumber,
        airline_code: formData.airlineCode,
        airline_name: formData.airlineName,
        aircraft_type: formData.aircraftType,
        departure_airport: formData.departureAirport.toUpperCase(),
        arrival_airport: formData.arrivalAirport.toUpperCase(),
        departure_time: new Date(formData.departureTime).toISOString(),
        arrival_time: new Date(formData.arrivalTime).toISOString(),
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
        arrivalTime: formatDateTimeLocal(new Date(new Date().getTime() + 5 * 60 * 60 * 1000)),
        status: "scheduled",
      });

      if (onFlightCreated) {
        onFlightCreated(createdFlight);
      }

      // Скрываем сообщение об успехе через 5 секунд
      setTimeout(() => setSuccess(""), 5000);

    } catch (err) {
      console.error("Ошибка создания рейса:", err);
      setErrors({ submit: err.message || "Ошибка при создании рейса" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    return date.toISOString().slice(0, 16);
  };

  // Рассчитываем продолжительность полёта для отображения
  const calculateFlightDuration = () => {
    if (!formData.departureTime || !formData.arrivalTime) return null;
    
    const departureTime = new Date(formData.departureTime);
    const arrivalTime = new Date(formData.arrivalTime);
    const durationMs = arrivalTime - departureTime;
    
    if (durationMs <= 0) return null;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}ч ${minutes}м`;
  };

  const flightDuration = calculateFlightDuration();

  return (
    <div className="create-flight-modern">
      <div className="create-flight-header">
        <div className="header-icon">✈️</div>
        <h2 className="header-title">Создание нового рейса</h2>
        <p className="header-subtitle">
          Заполните все поля для добавления рейса в систему управления
        </p>
      </div>

      {errors.submit && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {errors.submit}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modern-flight-form">
        {/* Блок: Основная информация */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">📋</span>
            Основная информация
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Номер рейса *
                <div className="input-with-icon">
                  <span className="input-icon">🔢</span>
                  <input
                    type="text"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      flightNumber: e.target.value.replace(/\D/g, '') 
                    }))}
                    onBlur={() => setTouched(prev => ({ ...prev, flightNumber: true }))}
                    placeholder="Например: 2425"
                    className={`form-input ${errors.flightNumber ? 'error' : ''}`}
                    maxLength={6}
                  />
                </div>
                {touched.flightNumber && errors.flightNumber && (
                  <div className="error-message">{errors.flightNumber}</div>
                )}
                <div className="input-hint">Только цифры, от 3 до 6 символов</div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Авиакомпания *
                <div className="input-with-icon">
                  <span className="input-icon">🏢</span>
                  <select
                    value={formData.airlineCode}
                    onChange={(e) => handleAirlineChange(e.target.value)}
                    className="form-select"
                  >
                    {AIRLINE_OPTIONS.map(airline => (
                      <option 
                        key={airline.code} 
                        value={airline.code}
                        style={{ color: airline.color }}
                      >
                        {airline.code} - {airline.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="selected-airline">
                  <span 
                    className="airline-color-badge" 
                    style={{ backgroundColor: AIRLINE_OPTIONS.find(a => a.code === formData.airlineCode)?.color }}
                  />
                  <span className="airline-name">{formData.airlineName}</span>
                </div>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Тип самолёта *
                <div className="input-with-icon">
                  <span className="input-icon">✈️</span>
                  <select
                    value={formData.aircraftType}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      aircraftType: e.target.value 
                    }))}
                    className="form-select"
                  >
                    {AIRCRAFT_OPTIONS.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Блок: Маршрут */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">🗺️</span>
            Маршрут
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Аэропорт вылета *
                <div className="input-with-icon">
                  <span className="input-icon">📍</span>
                  <input
                    type="text"
                    value={formData.departureAirport}
                    onChange={(e) => handleAirportChange('departureAirport', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, departureAirport: true }))}
                    placeholder="SVO, DME, LED..."
                    className={`form-input ${errors.departureAirport ? 'error' : ''}`}
                    maxLength={3}
                  />
                </div>
                {touched.departureAirport && errors.departureAirport && (
                  <div className="error-message">{errors.departureAirport}</div>
                )}
                {formData.departureAirport && KNOWN_AIRPORT_CODES.includes(formData.departureAirport.toUpperCase()) && (
                  <div className="city-display">
                    {AIRPORT_TO_CITY[formData.departureAirport.toUpperCase()]}
                  </div>
                )}
                <div className="input-hint">Код IATA (3 буквы)</div>
              </label>
            </div>

            <div className="route-arrow">→</div>

            <div className="form-group">
              <label className="form-label">
                Аэропорт прилёта *
                <div className="input-with-icon">
                  <span className="input-icon">🎯</span>
                  <input
                    type="text"
                    value={formData.arrivalAirport}
                    onChange={(e) => handleAirportChange('arrivalAirport', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, arrivalAirport: true }))}
                    placeholder="LED, AER, SVX..."
                    className={`form-input ${errors.arrivalAirport ? 'error' : ''}`}
                    maxLength={3}
                  />
                </div>
                {touched.arrivalAirport && errors.arrivalAirport && (
                  <div className="error-message">{errors.arrivalAirport}</div>
                )}
                {formData.arrivalAirport && KNOWN_AIRPORT_CODES.includes(formData.arrivalAirport.toUpperCase()) && (
                  <div className="city-display">
                    {AIRPORT_TO_CITY[formData.arrivalAirport.toUpperCase()]}
                  </div>
                )}
                <div className="input-hint">Код IATA (3 буквы)</div>
              </label>
            </div>
          </div>
        </div>

        {/* Блок: Время */}
        <div className="form-section">
          <h3 className="section-title">
            <span className="section-icon">⏰</span>
            Время полёта
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Вылет *
                <div className="input-with-icon">
                  <span className="input-icon">🛫</span>
                  <input
                    type="datetime-local"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      departureTime: e.target.value 
                    }))}
                    onBlur={() => setTouched(prev => ({ ...prev, departureTime: true }))}
                    className={`form-input ${errors.departureTime ? 'error' : ''}`}
                  />
                </div>
                {touched.departureTime && errors.departureTime && (
                  <div className="error-message">{errors.departureTime}</div>
                )}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Прилёт *
                <div className="input-with-icon">
                  <span className="input-icon">🛬</span>
                  <input
                    type="datetime-local"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      arrivalTime: e.target.value 
                    }))}
                    onBlur={() => setTouched(prev => ({ ...prev, arrivalTime: true }))}
                    className={`form-input ${errors.arrivalTime ? 'error' : ''}`}
                  />
                </div>
                {touched.arrivalTime && errors.arrivalTime && (
                  <div className="error-message">{errors.arrivalTime}</div>
                )}
                {flightDuration && !errors.arrivalTime && (
                  <div className="duration-display">
                    Продолжительность: <span className="duration-value">{flightDuration}</span>
                  </div>
                )}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Статус *
                <div className="status-selector">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status.value}
                      type="button"
                      className={`status-option ${formData.status === status.value ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                    >
                      <span className="status-icon">{status.icon}</span>
                      <span className="status-text">{status.label}</span>
                    </button>
                  ))}
                </div>
                <div className="selected-status">
                  Выбрано: <strong>{STATUS_OPTIONS.find(s => s.value === formData.status)?.label}</strong>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Блок: Кнопки */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-create"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner"></span>
                Создание рейса...
              </>
            ) : (
              <>
                <span className="btn-icon">✈️</span>
                Создать рейс
              </>
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setFormData({
                flightNumber: "",
                airlineCode: "SU",
                airlineName: "Аэрофлот",
                aircraftType: "Airbus A320",
                departureAirport: "",
                arrivalAirport: "",
                departureTime: formatDateTimeLocal(new Date(new Date().getTime() + 2 * 60 * 60 * 1000)),
                arrivalTime: formatDateTimeLocal(new Date(new Date().getTime() + 5 * 60 * 60 * 1000)),
                status: "scheduled",
              });
              setErrors({});
              setTouched({});
              setSuccess("");
            }}
          >
            <span className="btn-icon">🗑️</span>
            Очистить форму
          </button>
        </div>

        <div className="form-footer">
          <p className="form-note">
            <span className="note-icon">💡</span>
            Все поля, отмеченные *, обязательны для заполнения.
            Коды аэропортов должны существовать в системе.
          </p>
        </div>
      </form>
    </div>
  );
}