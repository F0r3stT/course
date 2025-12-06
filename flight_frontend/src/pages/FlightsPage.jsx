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

// формат времени для подробной карточки
function formatDateTimeRu(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Описание в зависимости от статуса рейса
function getStatusDescription(flight) {
  const dep = flight?.departure_time;
  const arr = flight?.arrival_time;

  switch (flight.status) {
    case "landed":
      return `Рейс прибыл. Вылет: ${formatDateTimeRu(
        dep,
      )}, посадка: ${formatDateTimeRu(arr)}.`;
    case "delayed":
      return `Рейс задержан. Новое расчётное время вылета: ${formatDateTimeRu(
        dep,
      )}, прибытия: ${formatDateTimeRu(arr)}.`;
    case "boarding":
      return `Идёт посадка. Плановый вылет: ${formatDateTimeRu(
        dep,
      )}, плановое прибытие: ${formatDateTimeRu(arr)}.`;
    case "in_air":
      return `Рейс в полёте. Вылет: ${formatDateTimeRu(
        dep,
      )}, расчётное время прибытия: ${formatDateTimeRu(arr)}.`;
    case "cancelled":
      return `Рейс отменён. Плановый вылет: ${formatDateTimeRu(
        dep,
      )}, плановое прибытие: ${formatDateTimeRu(arr)}.`;
    case "scheduled":
    default:
      return `Рейс ожидается. Плановый вылет: ${formatDateTimeRu(
        dep,
      )}, плановое прибытие: ${formatDateTimeRu(arr)}.`;
  }
}


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
  const [selectedFlight, setSelectedFlight] = useState(null); 

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
    const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
  };

  const handleCloseDetails = () => {
    setSelectedFlight(null);
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
            onSelectFlight={handleSelectFlight}
          />
        )}
      </section>
        {/* Подробная информация о выбранном рейсе */}
{selectedFlight && (
  <section
    style={{
      marginTop: 16,
      padding: 16,
      border: "1px solid #ddd",
      borderRadius: 8,
      backgroundColor: "#fafafa",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <h3 style={{ margin: 0 }}>
        Подробная информация о рейсе {selectedFlight.flight_number}
      </h3>
      <button onClick={handleCloseDetails}>Закрыть</button>
    </div>

    {(() => {
      const airlineCode = selectedFlight.airline_code
        ? selectedFlight.airline_code
        : selectedFlight.flight_number
            ?.slice(0, 2)
            .toUpperCase();

      const aircraftType = selectedFlight.aircraft_type || "не указано";
      const gateSector = selectedFlight.gate_sector || "не указан";
      const statusLabel =
        STATUS_LABELS_RU[selectedFlight.status] || selectedFlight.status;

      return (
        <div style={{ display: "grid", gap: 6 }}>
          <div>
            <strong>Номер рейса:</strong> {selectedFlight.flight_number}
          </div>
          <div>
            <strong>Авиакомпания:</strong> {airlineCode}
          </div>
          <div>
            <strong>Маршрут:</strong>{" "}
            {selectedFlight.departure_airport} →{" "}
            {selectedFlight.arrival_airport}
          </div>
          <div>
            <strong>Воздушное судно (ВС):</strong> {aircraftType}
          </div>
          <div>
            <strong>Сектор прибытия:</strong> {gateSector}
          </div>
          <div>
            <strong>Статус:</strong> {statusLabel}
          </div>
          <div>
            {getStatusDescription(selectedFlight)}
          </div>
        </div>
      );
    })()}
  </section>
)}

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
