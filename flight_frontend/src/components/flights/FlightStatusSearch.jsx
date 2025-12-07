import React, { useState } from "react";
import { searchFlightStatus } from "../../api/flightsApi";

export default function FlightStatusSearch() {
  const [mode, setMode] = useState("number"); // number | route
  const [flightNumber, setFlightNumber] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await searchFlightStatus(
        mode === "number"
          ? { flightNumber, date }
          : { from, to, date }
      );
      setResult(Array.isArray(data) ? data : data ? [data] : []);
    } catch (err) {
      setError(err.message || "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="status-card">
      <div className="status-tabs">
        <button
          type="button"
          className={mode === "number" ? "tab active" : "tab"}
          onClick={() => setMode("number")}
        >
          По номеру рейса
        </button>
        <button
          type="button"
          className={mode === "route" ? "tab active" : "tab"}
          onClick={() => setMode("route")}
        >
          По маршруту
        </button>
      </div>

      <form className="status-form" onSubmit={handleSearch}>
        {mode === "number" ? (
          <div className="form-group">
            <label>
              Номер рейса (цифры)
              <input
                type="text"
                value={flightNumber}
                onChange={(e) =>
                  setFlightNumber(e.target.value.replace(/\D/g, ""))
                }
              />
            </label>
          </div>
        ) : (
          <div className="status-route-grid">
            <div className="form-group">
              <label>
                Откуда (IATA)
                <input
                  type="text"
                  value={from}
                  onChange={(e) =>
                    setFrom(e.target.value.toUpperCase().slice(0, 3))
                  }
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Куда (IATA)
                <input
                  type="text"
                  value={to}
                  onChange={(e) =>
                    setTo(e.target.value.toUpperCase().slice(0, 3))
                  }
                />
              </label>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>
            Дата
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Поиск..." : "Проверить статус"}
        </button>
      </form>

      {error && <div className="board-error">{error}</div>}

      {result.length > 0 && (
        <div className="status-result">
          {/* можно вывести в виде мини-таблицы или карточек, использовав те же стили статусов */}
        </div>
      )}
    </section>
  );
}
