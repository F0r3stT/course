// src/components/flights/FlightForm.jsx
import { useEffect, useState } from "react";
import { createFlight, updateFlight } from "../../api/flightsApi";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "По расписанию" },
  { value: "boarding", label: "Посадка" },
  { value: "delayed", label: "Задержан" },
  { value: "cancelled", label: "Отменён" },
  { value: "in_air", label: "В полёте" },
  { value: "landed", label: "Прибыл" },
];

export default function FlightForm({
  mode = "create",
  initialFlight = null,
  // из FlightsPage сейчас приходят именно эти имена:
  onCreated,
  onUpdated,
  onCancel,
  selectedAirport,
}) {
  const [form, setForm] = useState({
    flightNumber: "",
    airlineCode: "",
    airlineName: "",
    aircraftType: "",
    departureAirport: selectedAirport || "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    status: "scheduled",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Заполняем форму при редактировании / инициализации
  useEffect(() => {
    if (mode === "edit" && initialFlight) {
      setForm({
        flightNumber: initialFlight.flight_number || "",
        airlineCode: (initialFlight.airline_code || "").toUpperCase(),
        airlineName: initialFlight.airline_name || "",
        aircraftType: initialFlight.aircraft_type || "",
        departureAirport: initialFlight.departure_airport || "",
        arrivalAirport: initialFlight.arrival_airport || "",
        departureTime: initialFlight.departure_time
          ? new Date(initialFlight.departure_time).toISOString().slice(0, 16)
          : "",
        arrivalTime: initialFlight.arrival_time
          ? new Date(initialFlight.arrival_time).toISOString().slice(0, 16)
          : "",
        status: initialFlight.status || "scheduled",
      });
    } else if (mode === "create") {
      // при создании можно автоподставить выбранный аэропорт табло как аэропорт вылета
      setForm((prev) => ({
        ...prev,
        departureAirport: selectedAirport || "",
      }));
    }
  }, [mode, initialFlight, selectedAirport]);

  // универсальный onChange для обычных полей
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // номер рейса — только цифры, 3–6 символов
  function handleFlightNumberChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, flightNumber: digits }));
  }

  // код авиакомпании — 2 символа, верхний регистр
  function handleAirlineCodeChange(e) {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 2) {
      value = value.slice(0, 2);
    }
    setForm((prev) => ({ ...prev, airlineCode: value }));
  }

  // IATA аэропортов — 3 буквы, верхний регистр
  function handleIataChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value.toUpperCase().slice(0, 3),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!form.flightNumber ||
          !form.airlineCode ||
          !form.departureAirport ||
          !form.arrivalAirport ||
          !form.departureTime ||
          !form.arrivalTime ||
          !form.status) {
        throw new Error("Заполните все обязательные поля");
      }

      if (form.airlineCode.length !== 2) {
        throw new Error("Код авиакомпании должен состоять из 2 символов");
      }

      if (mode === "create") {
        const created = await createFlight(form);
        if (onCreated) onCreated(created);

        // Сброс формы после успешного создания
        setForm({
          flightNumber: "",
          airlineCode: "",
          airlineName: "",
          aircraftType: "",
          departureAirport: selectedAirport || "",
          arrivalAirport: "",
          departureTime: "",
          arrivalTime: "",
          status: "scheduled",
        });
      } else if (mode === "edit" && initialFlight) {
        const updated = await updateFlight(initialFlight.id, form);
        if (onUpdated) onUpdated(updated);
      }
    } catch (err) {
      console.error("Flight form submit error:", err);
      setError(err.message || "Ошибка сохранения рейса");
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = mode === "create" ? "Создать рейс" : "Сохранить изменения";

  return (
    <form onSubmit={handleSubmit} className="flight-form">
      {/* Верхняя строка: слева статус, справа номер рейса + код авиакомпании */}
      <div className="flight-form-row">
        {/* Статус */}
        <div className="flight-form-col">
          <label className="flight-form-label">
            Статус
            <div className="status-buttons">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={
                    form.status === s.value
                      ? "status-chip status-chip-active"
                      : "status-chip"
                  }
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: s.value }))
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
            <small className="field-hint">
              Текущий статус:{" "}
              <strong>
                {STATUS_OPTIONS.find((s) => s.value === form.status)?.label ||
                  "не выбран"}
              </strong>
            </small>
          </label>
        </div>

        {/* Номер рейса + код авиакомпании */}
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Номер рейса (только цифры)
              <input
                type="text"
                name="flightNumber"
                value={form.flightNumber}
                onChange={handleFlightNumberChange}
                placeholder="Например, 1234"
              />
            </label>
          </div>

          <div className="form-group">
            <label className="flight-form-label">
              Код авиакомпании (2 символа)
              <input
                type="text"
                name="airlineCode"
                value={form.airlineCode}
                onChange={handleAirlineCodeChange}
                maxLength={2}
                placeholder="SU, S7, EK..."
              />
            </label>
            <small className="field-hint">
              Например: SU, S7, BA, EK, QR и т.д.
            </small>
          </div>
        </div>
      </div>

      {/* Блок: авиакомпания и тип самолёта */}
      <div className="flight-form-row">
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Название авиакомпании
              <input
                type="text"
                name="airlineName"
                value={form.airlineName}
                onChange={handleChange}
                placeholder="S7 Airlines, Emirates, Aeroflot..."
              />
            </label>
          </div>
        </div>
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Тип самолёта
              <input
                type="text"
                name="aircraftType"
                value={form.aircraftType}
                onChange={handleChange}
                placeholder="Boeing 737-800, Airbus A320..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Маршрут */}
      <div className="flight-form-row">
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Аэропорт вылета (IATA)
              <input
                type="text"
                name="departureAirport"
                value={form.departureAirport}
                onChange={handleIataChange}
                placeholder="SVO"
              />
            </label>
          </div>
        </div>
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Аэропорт прилёта (IATA)
              <input
                type="text"
                name="arrivalAirport"
                value={form.arrivalAirport}
                onChange={handleIataChange}
                placeholder="LHR"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Время вылета / прилёта */}
      <div className="flight-form-row">
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Время вылета
              <input
                type="datetime-local"
                name="departureTime"
                value={form.departureTime}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>
        <div className="flight-form-col">
          <div className="form-group">
            <label className="flight-form-label">
              Время прилёта
              <input
                type="datetime-local"
                name="arrivalTime"
                value={form.arrivalTime}
                onChange={handleChange}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="flight-form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Сохранение..." : submitLabel}
        </button>
        {mode === "edit" && onCancel && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Отмена
          </button>
        )}
        {error && <span className="text-error">Ошибка: {error}</span>}
      </div>
    </form>
  );
}
