// src/components/flights/FlightsTable.jsx
import { STATUS_LABELS_RU } from "../../pages/FlightsPage.jsx";

function formatDateTimeRu(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightsTable({
  flights,
  mode,
  canManage,
  onSetDelayed,
  onSetCancelled,
  onEdit,
  onDelete,
  onSelectFlight,
}) {
  const isDepartures = mode === "departures";

  const getStatusClass = (status) => {
    switch (status) {
      case "scheduled":
        return "status-pill status-scheduled";
      case "boarding":
        return "status-pill status-boarding";
      case "delayed":
        return "status-pill status-delayed";
      case "cancelled":
        return "status-pill status-cancelled";
      case "in_air":
        return "status-pill status-in_air";
      case "landed":
        return "status-pill status-landed";
      default:
        return "status-pill";
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <table className="flights-table">
      <thead>
        <tr>
          <th>Рейс</th>
          <th>Авиакомпания</th>
          <th>{isDepartures ? "Вылет" : "Прилёт"}</th>
          <th>{isDepartures ? "Аэропорт прилёта" : "Аэропорт вылета"}</th>
          <th>Статус</th>
          {canManage && <th>Действия</th>}
        </tr>
      </thead>
      <tbody>
        {flights.map((f) => {
          const airlineCode =
            f.airline_code ||
            (f.flight_number || "").slice(0, 2).toUpperCase();

          return (
            <tr
              key={f.id}
              onClick={() => onSelectFlight && onSelectFlight(f)}
              style={{ cursor: "pointer" }}
            >
              <td>{f.flight_number}</td>
              <td>{airlineCode}</td>
              <td>
                {isDepartures
                  ? formatTime(f.departure_time)
                  : formatTime(f.arrival_time)}
              </td>
              <td>
                {isDepartures
                  ? f.arrival_airport
                  : f.departure_airport}
              </td>
              <td>
                <span className={getStatusClass(f.status)}>
                  {f.status}
                </span>
              </td>
              {canManage && (
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDelayed(f);
                      }}
                    >
                      Задержать
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCancelled(f);
                      }}
                    >
                      Отменить
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(f);
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(f);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const thStyle = {
  borderBottom: "2px solid #ccc",
  padding: "8px 6px",
  textAlign: "left",
  backgroundColor: "#f5f5f5",
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "6px 6px",
};
