import { useEffect, useState } from "react";
import { createFlight } from "../../api/flightsApi";
// если updateFlight лежит в том же файле api:
import { updateFlight } from "../../api/flightsApi";

function FlightForm({
  mode = "create",
  initialFlight = null,
  onFlightCreated,
  onFlightUpdated,
  onCancel,
}) {
  const [form, setForm] = useState({
    flightNumber: "",
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
        departureAirport: initialFlight.departure_airport,
        arrivalAirport: initialFlight.arrival_airport,
        // превращаем ISO-строку в формат для input[type=datetime-local]
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

  const submitLabel =
    mode === "create" ? "Создать рейс" : "Сохранить изменения";

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px 16px",
        marginBottom: 24,
        padding: 16,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <div>
        <label>
          Номер рейса:
          <br />
          <input
            type="text"
            name="flightNumber"
            value={form.flightNumber}
            onChange={handleChange}
            placeholder="SU100"
          />
        </label>
      </div>

      <div>
        <label>
          Статус:
          <br />
          <input
            type="text"
            name="status"
            value={form.status}
            onChange={handleChange}
            placeholder="scheduled / boarding / delayed"
          />
        </label>
      </div>

      <div>
        <label>
          Аэропорт вылета (IATA, 3 буквы):
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
          Аэропорт прилёта (IATA, 3 буквы):
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
