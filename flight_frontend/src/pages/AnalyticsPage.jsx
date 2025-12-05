// src/pages/AnalyticsPage.jsx
import { useEffect, useState } from "react";
import { fetchStatusSummary } from "../api/analyticsApi.js";

export default function AnalyticsPage() {
  const [statusSummary, setStatusSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchStatusSummary(); // [{ status, count }]
        if (!isMounted) return;
        setStatusSummary(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Ошибка загрузки аналитики");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const total = statusSummary.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div>
      <h2>Аналитика по статусам рейсов</h2>

      {loading && <p>Загрузка аналитики...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && statusSummary.length === 0 && (
        <p>Данных пока нет.</p>
      )}

      {!loading && !error && statusSummary.length > 0 && (
        <>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: "400px",
              marginTop: "16px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Статус
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "right",
                  }}
                >
                  Количество рейсов
                </th>
                <th
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "right",
                  }}
                >
                  Доля, %
                </th>
              </tr>
            </thead>
            <tbody>
              {statusSummary.map((item) => {
                const count = Number(item.count || 0);
                const percent =
                  total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

                return (
                  <tr key={item.status}>
                    <td
                      style={{
                        border: "1px solid #eee",
                        padding: "8px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.status}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eee",
                        padding: "8px",
                        textAlign: "right",
                      }}
                    >
                      {count}
                    </td>
                    <td
                      style={{
                        border: "1px solid #eee",
                        padding: "8px",
                        textAlign: "right",
                      }}
                    >
                      {percent}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td
                  style={{
                    borderTop: "2px solid #ccc",
                    padding: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Итого
                </td>
                <td
                  style={{
                    borderTop: "2px solid #ccc",
                    padding: "8px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  {total}
                </td>
                <td
                  style={{
                    borderTop: "2px solid #ccc",
                    padding: "8px",
                    textAlign: "right",
                    fontWeight: "bold",
                  }}
                >
                  100.0
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
