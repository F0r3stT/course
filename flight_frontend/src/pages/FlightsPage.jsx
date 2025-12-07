// src/pages/FlightsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchFlights } from "../api/flightsApi";
import { useAuth } from "../context/AuthContext";

import FlightsTable from "../components/flights/FlightsTable";
import FlightForm from "../components/flights/FlightForm";
import FlightDetailsModal from "../components/flights/FlightDetailsModal";
import FlightStatusSearch from "../components/flights/FlightStatusSearch";

// Справочник аэропортов
const AIRPORTS = [
  { code: "SVO", city: "Москва", name: "Шереметьево" },
  { code: "DME", city: "Москва", name: "Домодедово" },
  { code: "VKO", city: "Москва", name: "Внуково" },
  { code: "LHR", city: "Лондон", name: "Хитроу" },
  { code: "DXB", city: "Дубай", name: "Dubai International" },
];

function getAirportByCode(code) {
  return AIRPORTS.find((a) => a.code === code) || null;
}

export default function FlightsPage() {
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";

  const today = new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState("departures"); // "departures" | "arrivals"
  const [date, setDate] = useState(today);
  const [airportCode, setAirportCode] = useState("SVO");

  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedFlight, setSelectedFlight] = useState(null);
  const [editingFlight, setEditingFlight] = useState(null);

  const currentAirport = getAirportByCode(airportCode);
  const hasAirport = Boolean(airportCode);

  const boardSubtitle = currentAirport
    ? `${currentAirport.city} — ${currentAirport.name} (${currentAirport.code})`
    : airportCode;

  // загрузка всех рейсов (фильтруем на фронте)
  async function loadFlights() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await fetchFlights();
      setFlights(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadFlights error", err);
      setErrorMessage("Не удалось загрузить рейсы. Попробуйте позже.");
    } finally {
      setIsLoading(false);
    }
  }

  // при изменении режима, даты или аэропорта – просто перезагружаем данные
  useEffect(() => {
    if (!airportCode) {
      setFlights([]);
      return;
    }
    loadFlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, date, airportCode]);

  // фильтрация по режиму / дате / аэропорту
  const filteredFlights = useMemo(() => {
    if (!flights.length) return [];

    return flights.filter((f) => {
      const depTime = new Date(f.departure_time);
      const arrTime = new Date(f.arrival_time);

      const timeForMode = mode === "departures" ? depTime : arrTime;
      const airportForMode =
        mode === "departures" ? f.departure_airport : f.arrival_airport;

      const flightDate = timeForMode.toISOString().slice(0, 10);

      const sameDate = flightDate === date;
      const sameAirport = airportForMode === airportCode;

      return sameDate && sameAirport;
    });
  }, [flights, mode, airportCode, date]);

  // обработчики
  const handleRefreshClick = () => loadFlights();

  const handleRowClick = (flight) => setSelectedFlight(flight);
  const handleCloseDetails = () => setSelectedFlight(null);

  const handleEditClick = (flight) => setEditingFlight(flight);
  const handleCreateNew = () => setEditingFlight(null);

  const handleFormSaved = () => {
    setEditingFlight(null);
    loadFlights();
  };

  return (
    <div className="board-layout">
      {/* ЛЕВАЯ КОЛОНКА: табло + поиск статуса */}
      <section className="board-main">
        <header className="board-header">
          <div>
            <h1 className="board-title">Табло рейсов</h1>
            <div className="board-subtitle">{boardSubtitle}</div>
          </div>

          <div className="board-header-controls">
            <div className="board-modes">
              <button
                type="button"
                className={`board-mode-btn ${
                  mode === "departures" ? "active" : ""
                }`}
                onClick={() => setMode("departures")}
              >
                ✈ Вылеты
              </button>
              <button
                type="button"
                className={`board-mode-btn ${
                  mode === "arrivals" ? "active" : ""
                }`}
                onClick={() => setMode("arrivals")}
              >
                🛬 Прилёты
              </button>
            </div>

            <div className="board-filters">
              <div className="field-group">
                <label>Дата</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Аэропорт табло</label>
                <select
                  value={airportCode}
                  onChange={(e) => setAirportCode(e.target.value)}
                >
                  {AIRPORTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.city}, {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRefreshClick}
                disabled={isLoading || !hasAirport}
              >
                Обновить
              </button>
            </div>
          </div>
        </header>

        <div className="board-body">
          {/* поиск статуса рейса по номеру / маршруту */}
          <FlightStatusSearch />

          {!hasAirport && (
            <div className="board-empty">
              Выберите аэропорт и дату, чтобы увидеть доступные рейсы.
            </div>
          )}

          {hasAirport && isLoading && (
            <div className="board-empty">Загрузка рейсов…</div>
          )}

          {hasAirport && !isLoading && errorMessage && (
            <div className="board-error">{errorMessage}</div>
          )}

          {hasAirport &&
            !isLoading &&
            !errorMessage &&
            filteredFlights.length === 0 && (
              <div className="board-empty">
                Рейсов по выбранным критериям нет.
              </div>
            )}

          {hasAirport &&
            !isLoading &&
            !errorMessage &&
            filteredFlights.length > 0 && (
              <FlightsTable
                flights={filteredFlights}
                mode={mode}
                isAdmin={!!user}
                onSelectFlight={handleRowClick}
                onEditFlight={handleEditClick}
              />
            )}
        </div>
      </section>

      {/* ПРАВАЯ КОЛОНКА: управление рейсами (только для admin) */}
      {isAdmin && (
        <aside className="board-right">
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Управление рейсами</h2>
              <button
                type="button"
                className="link-button"
                onClick={handleCreateNew}
              >
                Создать новый рейс
              </button>
            </div>
            <p className="admin-subtitle">
              Создание и редактирование рейсов доступно только
              авторизованному персоналу.
            </p>

            <FlightForm
              editingFlight={editingFlight}
              selectedAirport={airportCode || "SVO"}
              onSaved={handleFormSaved}
              onCancel={() => setEditingFlight(null)}
            />
          </section>
        </aside>
      )}

      {/* Модальное окно с деталями рейса */}
      <FlightDetailsModal
        flight={selectedFlight}
        onClose={handleCloseDetails}
        airport={currentAirport}
      />
    </div>
  );
}
