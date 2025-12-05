// src/pages/FlightsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  fetchFlights,
  createFlight,
  updateFlight,
  updateFlightStatus,
  deleteFlight,
} from "../api/flightsApi.js";
import FlightsTable from "../components/flights/FlightsTable.jsx";
import FlightForm from "../components/flights/FlightForm.jsx";

const DEFAULT_AIRPORT = "SVO"; // главный аэропорт для табло (можешь поменять)

// Русские подписи статусов для отображения
export const STATUS_LABELS_RU = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Прибыл",
};

function isSameDate(isoString, targetDateYmd) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === targetDateYmd;
}

export default function FlightsPage() {
  const { isAuthenticated, user } = useAuth();
  const canManage =
    isAuthenticated && user && (user.role === "admin" || user.role === "staff");

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [boardMode, setBoardMode] = useState("departures"); // departures | arrivals
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const [editingFlight, setEditingFlight] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadFlights = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchFlights();
      setFlights(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Ошибка загрузки рейсов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const handleRefresh = () => {
    loadFlights();
  };

  const filteredFlights = useMemo(() => {
    return flights
      .filter((f) => {
        const timeToUse =
          boardMode === "departures" ? f.departure_time : f.arrival_time;
        if (!isSameDate(timeToUse, selectedDate)) return false;

        if (boardMode === "departures") {
          return f.departure_airport === DEFAULT_AIRPORT;
        }
        return f.arrival_airport === DEFAULT_AIRPORT;
      })
      .sort((a, b) => {
        const ta =
          boardMode === "departures"
            ? new Date(a.departure_time)
            : new Date(a.arrival_time);
        const tb =
          boardMode === "departures"
            ? new Date(b.departure_time)
            : new Date(b.arrival_time);
        return ta - tb;
      });
  }, [flights, boardMode, selectedDate]);

  // ====== обработчики для сотрудника ======

  const handleCreateClick = () => {
    setEditingFlight(null);
    setShowForm(true);
  };

  const handleEdit = (flight) => {
    setEditingFlight(flight);
    setShowForm(true);
  };

  const handleDelete = async (flight) => {
    if (!window.confirm(`Удалить рейс ${flight.flight_number}?`)) return;
    try {
      await deleteFlight(flight.id);
      await loadFlights();
    } catch (err) {
      alert(err.message || "Ошибка удаления рейса");
    }
  };

  const handleSetDelayed = async (flight) => {
    try {
      await updateFlightStatus(flight.id, "delayed");
      await loadFlights();
    } catch (err) {
      alert(err.message || "Ошибка изменения статуса");
    }
  };

  const handleSetCancelled = async (flight) => {
    try {
      await updateFlightStatus(flight.id, "cancelled");
      await loadFlights();
    } catch (err) {
      alert(err.message || "Ошибка изменения статуса");
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingFlight) {
        await updateFlight(editingFlight.id, formData);
      } else {
        await createFlight(formData);
      }
      setShowForm(false);
      setEditingFlight(null);
      await loadFlights();
    } catch (err) {
      alert(err.message || "Ошибка сохранения рейса");
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFlight(null);
  };

  return (
    <div>
      {/* Панель табло */}
      <section
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setBoardMode("departures")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border:
                  boardMode === "departures"
                    ? "2px solid #1976d2"
                    : "1px solid #ccc",
                backgroundColor:
                  boardMode === "departures" ? "#e3f2fd" : "#f5f5f5",
                cursor: "pointer",
              }}
            >
              Вылеты
            </button>
            <button
              onClick={() => setBoardMode("arrivals")}
              style={{
                padding: "6px 12px",
                borderRadius: 4,
                border:
                  boardMode === "arrivals"
                    ? "2px solid #1976d2"
                    : "1px solid #ccc",
                backgroundColor:
                  boardMode === "arrivals" ? "#e3f2fd" : "#f5f5f5",
                cursor: "pointer",
              }}
            >
              Прилёты
            </button>
          </div>

          <div>
            <label style={{ marginRight: 8 }}>Дата:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div>
            <span>
              Аэропорт табло: <strong>{DEFAULT_AIRPORT}</strong>
            </span>
          </div>

          <button onClick={handleRefresh}>Обновить</button>
        </div>

        {loading && <p>Загрузка рейсов...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && filteredFlights.length === 0 && (
          <p>Рейсов по выбранным критериям нет.</p>
        )}

        {!loading && !error && filteredFlights.length > 0 && (
          <FlightsTable
            flights={filteredFlights}
            mode={boardMode}
            canManage={canManage}
            onSetDelayed={handleSetDelayed}
            onSetCancelled={handleSetCancelled}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      {/* Панель управления рейсами только для сотрудников */}
      {canManage && (
        <section
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0 }}>Управление рейсами</h2>
            <button onClick={handleCreateClick}>Создать рейс</button>
          </div>

          {showForm && (
            <FlightForm
              initialFlight={editingFlight}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          )}
        </section>
      )}
    </div>
  );
}
