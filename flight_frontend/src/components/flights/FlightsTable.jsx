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
  mode, // 'departures' | 'arrivals'
  canManage,
  onSetDelayed,
  onSetCancelled,
  onEdit,
  onDelete,
}) {
  const timeColumnTitle = mode === "departures" ? "Время вылета" : "Время прилёта";

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 14,
      }}
    >
      <thead>
        <tr>
          <th style={thStyle}>Рейс</th>
          <th style={thStyle}>Авиакомпания</th>
          <th style={thStyle}>Откуда</th>
          <th style={thStyle}>Куда</th>
          <th style={thStyle}>{timeColumnTitle}</th>
          <th style={thStyle}>Статус</th>
          {canManage && <th style={thStyle}>Действия</th>}
        </tr>
      </thead>
      <tbody>
        {flights.map((f) => {
          const airlineCode = f.flight_number
            ? f.flight_number.slice(0, 2).toUpperCase()
            : "";
          const timeToShow =
            mode === "departures" ? f.departure_time : f.arrival_time;
          const statusLabel = STATUS_LABELS_RU[f.status] || f.status;

          return (
            <tr key={f.id}>
              <td style={tdStyle}>{f.flight_number}</td>
              <td style={tdStyle}>{airlineCode}</td>
              <td style={tdStyle}>{f.departure_airport}</td>
              <td style={tdStyle}>{f.arrival_airport}</td>
              <td style={tdStyle}>{formatDateTimeRu(timeToShow)}</td>
              <td style={tdStyle}>{statusLabel}</td>
              {canManage && (
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <button
                      onClick={() => onSetDelayed(f)}
                      style={{ fontSize: 12 }}
                    >
                      Задержать
                    </button>
                    <button
                      onClick={() => onSetCancelled(f)}
                      style={{ fontSize: 12 }}
                    >
                      Отменить
                    </button>
                    <button
                      onClick={() => onEdit(f)}
                      style={{ fontSize: 12 }}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => onDelete(f)}
                      style={{ fontSize: 12 }}
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
