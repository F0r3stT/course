const ANALYTICS_BASE = "http://localhost:8000";

export async function fetchStatusSummary() {
  const res = await fetch(`${ANALYTICS_BASE}/analytics/status-summary`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Ошибка загрузки аналитики по статусам (HTTP ${res.status}): ${text}`
    );
  }
  return res.json(); // ожидаем массив [{ status, count }, ...]
}
