import { useState } from "react";
import { createFlight } from "../api/flightsApi";

// props:
// - onFlightCreated(newFlight) — колбэк, вызывается при успешном создании
function FlightForm({ onFlightCreated }) {
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const newFlight = await createFlight(form);
      // уведомляем родителя
      if (onFlightCreated) {
        onFlightCreated(newFlight);
      }
      // сбрасываем форму
      setForm({
        flightNumber: "",
        departureAirport: "",
        arrivalAirport: "",
        departureTime: "",
        arrivalTime: "",
        status: "",
      });
    } catch (err) {
      console.error("Create flight error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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
          {submitting ? "Создание..." : "Создать рейс"}
        </button>
        {error && (
          <span style={{ color: "red", marginLeft: 16 }}>Ошибка: {error}</span>
        )}
      </div>
    </form>
  );
}

export default FlightForm;
