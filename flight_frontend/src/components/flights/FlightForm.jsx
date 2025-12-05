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

function FlightForm({
  mode = "create",
  initialFlight = null,
  onFlightCreated,
  onFlightUpdated,
  onCancel,
}) {
  const [form, setForm] = useState({
    flightNumber: "",
    airlineCode: "",
    departureAirport: "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // при переходе в режим редактирования заполняем форму
  useEffect(() => {
    if (mode === "edit" && initialFlight) {
  setForm({
    flightNumber: initialFlight.flight_number,
    airlineCode: initialFlight.airline_code || "", // если появится на бэке, подхватим
    departureAirport: initialFlight.departure_airport,
    arrivalAirport: initialFlight.arrival_airport,
    departureTime: initialFlight.departure_time
      ? new Date(initialFlight.departure_time).toISOString().slice(0, 16)
      : "",
    arrivalTime: initialFlight.arrival_time
      ? new Date(initialFlight.arrival_time).toISOString().slice(0, 16)
      : "",
    status: initialFlight.status,
  });
}
if (mode === "create") {
  setForm({
    flightNumber: "",
    airlineCode: "",
    departureAirport: "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    status: "",
  });
}

  }, [mode, initialFlight]);

  
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAirlineCodeChange(e) {
  let value = e.target.value.toUpperCase();
  if (value.length > 2) {
    value = value.slice(0, 2);
  }
  setForm((prev) => ({ ...prev, airlineCode: value }));
}


  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "create") {
        const newFlight = await createFlight(form);
        onFlightCreated && onFlightCreated(newFlight);
        // сброс после создания
        setForm({
          flightNumber: "",
          departureAirport: "",
          arrivalAirport: "",
          departureTime: "",
          arrivalTime: "",
          status: "",
        });
      } else if (mode === "edit" && initialFlight) {
        const updatedFlight = await updateFlight(initialFlight.id, form);
        onFlightUpdated && onFlightUpdated(updatedFlight);
      }
    } catch (err) {
      console.error("Flight form submit error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const airlineCode = (form.flightNumber || "").slice(0, 2).toUpperCase();


  const submitLabel =
    mode === "create" ? "Создать рейс" : "Сохранить изменения";

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
  {/* Верхняя строка: слева статус, справа номер рейса + аббревиатура */}
  <div
    style={{
      display: "flex",
      gap: "32px",
      alignItems: "flex-start",
      marginBottom: 16,
      flexWrap: "wrap",
    }}
  >
    {/* Левая колонка: статус */}
    <div style={{ flex: 1, minWidth: 260 }}>
      <label>
        Статус:
        <br />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, status: s.value }))
              }
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border:
                  form.status === s.value
                    ? "2px solid #1976d2"
                    : "1px solid #ccc",
                backgroundColor:
                  form.status === s.value ? "#e3f2fd" : "#f5f5f5",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <small style={{ color: "#666" }}>
          Текущий статус:{" "}
          <strong>
            {STATUS_OPTIONS.find((s) => s.value === form.status)?.label ||
              "не выбран"}
          </strong>
        </small>
      </label>
    </div>

    {/* Правая колонка: номер рейса и аббревиатура */}
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ marginBottom: 8 }}>
        <label>
          Номер рейса:
          <br />
          <input
            type="text"
            name="flightNumber"
            value={form.flightNumber}
            onChange={handleChange}
            placeholder="Например, SU100"
            style={{ width: "100%" }}
          />
        </label>
      </div>

      <div>
        <label>
          Авиакомпания (аббревиатура, 2 символа):
          <br />
          <input
            type="text"
            name="airlineCode"
            value={form.airlineCode}
            onChange={handleAirlineCodeChange}
            maxLength={2}
            style={{ width: "100%" }}
          />
        </label>
        <small style={{ color: "#666" }}>
          Введите код авиакомпании, например: SU, U6, S7 и т.д.
        </small>
      </div>
    </div>
  </div>

      <div>
        <label>
          Аэропорт вылета:
          <br />
          <input
            type="text"
            name="departureAirport"
            value={form.departureAirport}
            onChange={handleChange}
            placeholder="SVO"
          />
        </label>
      </div>

      <div>
        <label>
          Аэропорт прилёта:
          <br />
          <input
            type="text"
            name="arrivalAirport"
            value={form.arrivalAirport}
            onChange={handleChange}
            placeholder="LHR"
          />
        </label>
      </div>

      <div>
        <label>
          Время вылета:
          <br />
          <input
            type="datetime-local"
            name="departureTime"
            value={form.departureTime}
            onChange={handleChange}
          />
        </label>
      </div>

      <div>
        <label>
          Время прилёта:
          <br />
          <input
            type="datetime-local"
            name="arrivalTime"
            value={form.arrivalTime}
            onChange={handleChange}
          />
        </label>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : submitLabel}
        </button>
        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ marginLeft: 12 }}
            disabled={submitting}
          >
            Отмена
          </button>
        )}
        {error && (
          <span style={{ color: "red", marginLeft: 16 }}>Ошибка: {error}</span>
        )}
      </div>
    </form>
  );
}

export default FlightForm;
