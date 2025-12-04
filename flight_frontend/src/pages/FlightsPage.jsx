import { useEffect, useState } from "react";
import {
  fetchFlights,
  updateFlightStatus,
  deleteFlight,
} from "../api/flightsApi";
import FlightForm from "../components/flights/FlightForm";
import FlightsTable from "../components/flights/FlightsTable";
function FlightsPage() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusError, setStatusError] = useState(null);

  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [editingFlight, setEditingFlight] = useState(null);

  useEffect(() => {
    fetchFlights()
      .then((data) => {
        setFlights(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching flights:", err);
        setLoadError(err.message);
        setLoading(false);
      });
  }, []);

  function handleFlightCreated(newFlight) {
    setFlights((prev) => [...prev, newFlight]);
  }

  function handleEditClick(flight) {
    setEditingFlight(flight);
    setFormMode("edit");
  }

  function handleFlightUpdated(updatedFlight) {
    setFlights((prev) =>
      prev.map((f) => (f.id === updatedFlight.id ? updatedFlight : f))
    );
    setEditingFlight(null);
    setFormMode("create");
  }

  function handleCancelEdit() {
    setEditingFlight(null);
    setFormMode("create");
  }

  async function handleStatusChange(id, newStatus) {
    setStatusError(null);
    try {
      const updated = await updateFlightStatus(id, newStatus);
      setFlights((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      setStatusError(err.message);
    }
  }

  async function handleDelete(id) {
    setStatusError(null);
    try {
      await deleteFlight(id);
      setFlights((prev) => prev.filter((f) => f.id !== id));
      // если удалили рейс, который редактировали — сбросить режим
      if (editingFlight && editingFlight.id === id) {
        setEditingFlight(null);
        setFormMode("create");
      }
    } catch (err) {
      console.error("Error deleting flight:", err);
      setStatusError(err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Загрузка рейсов...</div>;
  }

  if (loadError) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Рейсы авиакомпании</h1>
        <p style={{ color: "red" }}>Ошибка загрузки рейсов: {loadError}</p>
      </div>
    );
  }

  const formTitle =
    formMode === "create" ? "Создать новый рейс" : "Редактировать рейс";

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Рейсы авиакомпании</h1>

      <h2>{formTitle}</h2>
      <FlightForm
        mode={formMode}
        initialFlight={editingFlight}
        onFlightCreated={handleFlightCreated}
        onFlightUpdated={handleFlightUpdated}
        onCancel={handleCancelEdit}
      />

      <h2>Список рейсов</h2>
      {statusError && (
        <p style={{ color: "red" }}>
          Ошибка при обновлении статуса / удалении: {statusError}
        </p>
      )}
      <FlightsTable
        flights={flights}
        onChangeStatus={handleStatusChange}
        onDelete={handleDelete}
        onEdit={handleEditClick}
      />
    </div>
  );
}

export default FlightsPage;
