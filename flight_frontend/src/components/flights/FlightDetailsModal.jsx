// src/components/flights/FlightDetailsModal.jsx
const formatDateTimeRu = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusDescription = (flight) => {
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
};

export default function FlightDetailsModal({ flight, onClose, statusLabels }) {
  const airlineCode =
    flight.airline_code ||
    (flight.flight_number || "").slice(0, 2).toUpperCase();
  const aircraftType = flight.aircraft_type || "не указано";
  const gateSector = flight.gate_sector || "не указан";
  const statusLabel = statusLabels?.[flight.status] || flight.status;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div>
            <div className="board-title">
              Рейс {flight.flight_number}
            </div>
            <div className="board-subtitle">
              Подробная информация о текущем статусе и расписании
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
          <div>
            <strong>Номер рейса:</strong> {flight.flight_number}
          </div>
          <div>
            <strong>Авиакомпания:</strong> {airlineCode}
          </div>
          <div>
            <strong>Маршрут:</strong>{" "}
            {flight.departure_airport} → {flight.arrival_airport}
          </div>
          <div>
            <strong>Воздушное судно (ВС):</strong> {aircraftType}
          </div>
          <div>
            <strong>Сектор прибытия:</strong> {gateSector}
          </div>
          <div>
            <strong>Плановый вылет:</strong>{" "}
            {formatDateTimeRu(flight.departure_time)}
          </div>
          <div>
            <strong>Плановое/фактическое прибытие:</strong>{" "}
            {formatDateTimeRu(flight.arrival_time)}
          </div>
          <div>
            <strong>Статус:</strong> {statusLabel}
          </div>
          <div>{getStatusDescription(flight)}</div>
        </div>
      </div>
    </div>
  );
}
