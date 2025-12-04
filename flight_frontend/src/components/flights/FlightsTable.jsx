function FlightsTable({ flights, onChangeStatus, onDelete, onEdit }) {
  if (!flights || flights.length === 0) {
    return <p>Рейсов нет.</p>;
  }

  return (
    <table border="1" cellPadding="8" cellSpacing="0" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>№</th>
          <th>Номер рейса</th>
          <th>Из</th>
          <th>В</th>
          <th>Вылет</th>
          <th>Прилёт</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((f, index) => (
          <tr key={f.id}>
            <td>{index + 1}</td>
            <td>{f.flight_number}</td>
            <td>{f.departure_airport}</td>
            <td>{f.arrival_airport}</td>
            <td>{new Date(f.departure_time).toLocaleString()}</td>
            <td>{new Date(f.arrival_time).toLocaleString()}</td>
            <td>{f.status}</td>
            <td>
              <button
                onClick={() => onChangeStatus && onChangeStatus(f.id, "delayed")}
                style={{ marginRight: 8 }}
              >
                Задержан
              </button>
              <button
                onClick={() =>
                  onChangeStatus && onChangeStatus(f.id, "boarding")
                }
                style={{ marginRight: 8 }}
              >
                Посадка
              </button>
              <button
                onClick={() => onEdit && onEdit(f)}
                style={{ marginRight: 8 }}
              >
                Редактировать
              </button>
              <button
                onClick={() => onDelete && onDelete(f.id)}
                style={{ color: "red" }}
              >
                Удалить
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default FlightsTable;
