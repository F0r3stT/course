import React from "react";

const STATUS_LABELS = {
  scheduled: "По расписанию",
  boarding: "Посадка",
  delayed: "Задержан",
  cancelled: "Отменён",
  in_air: "В полёте",
  landed: "Прибыл",
};

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FlightsTable({
  flights,
  mode,          // "departures" | "arrivals"
  isAdmin,
  onSelectFlight,
  onEditFlight,
}) {
  const timeTitle = mode === "departures" ? "Время вылета" : "Время прилёта";

  return (
    <div className="board-table-wrapper">
      <table className="board-table">
        <thead>
          <tr>
            <th>Рейс</th>
            <th>Авиакомпания</th>
            <th>Откуда</th>
            <th>Куда</th>
            <th>{timeTitle}</th>
            <th>Статус</th>
            {isAdmin && <th>Действия</th>}
          </tr>
        </thead>
        <tbody>
          {flights.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 7 : 6} className="empty-row">
                Для выбранной даты и аэропорта рейсов нет
              </td>
            </tr>
          )}

          {flights.map((f) => {
            const mainTime =
              mode === "departures" ? f.departure_time : f.arrival_time;

            const statusLabel =
              STATUS_LABELS[f.status] || f.status || "—";

            return (
              <tr
                key={f.id}
                className="board-row"
                onClick={() => onSelectFlight && onSelectFlight(f)}
              >
                <td>{f.flight_number}</td>
                <td>{f.airline_code || "—"}</td>
                <td>{f.departure_airport}</td>
                <td>{f.arrival_airport}</td>
                <td>{formatTime(mainTime)}</td>
                <td>
                  <span className={`status-pill status-${f.status || "default"}`}>
                    {statusLabel}
                  </span>
                </td>
                {isAdmin && (
                  <td
                    onClick={(e) => {
                      e.stopPropagation(); // чтобы не открывался модал
                      onEditFlight && onEditFlight(f);
                    }}
                  >
                    <button type="button" className="btn-ghost small">
                      Редактировать
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
