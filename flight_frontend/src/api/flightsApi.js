const API_BASE = "http://localhost:8080";

// Получение всех рейсов
export async function fetchFlights() {
  const res = await fetch("/api/flights");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки рейсов: ${text}`);
  }
  return res.json();
}

// Получение всех авиакомпаний
export async function fetchAirlines() {
  const res = await fetch("/api/airlines");
  if (!res.ok) {
    // Если эндпоинта нет, возвращаем статические данные
    return [
      { code: 'SU', name: 'Аэрофлот', country: 'Россия', fleet_size: 250 },
      { code: 'S7', name: 'S7 Airlines', country: 'Россия', fleet_size: 120 },
      { code: 'U6', name: 'Уральские авиалинии', country: 'Россия', fleet_size: 50 },
      { code: 'FV', name: 'Россия', country: 'Россия', fleet_size: 80 },
      { code: 'TK', name: 'Turkish Airlines', country: 'Турция', fleet_size: 350 },
      { code: 'LH', name: 'Lufthansa', country: 'Германия', fleet_size: 280 },
      { code: 'AF', name: 'Air France', country: 'Франция', fleet_size: 210 }
    ];
  }
  return res.json();
}

// Получение рейсов по авиакомпании
export async function fetchAirlineFlights(airlineCode) {
  const res = await fetch(`/api/airlines/${encodeURIComponent(airlineCode)}/flights`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки рейсов авиакомпании: ${text}`);
  }
  return res.json();
}

// Создание нового рейса
export async function createFlight(flightData) {
  const res = await fetch("/api/flights", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("flightboard_auth") || "{}")?.token || ""}`,
    },
    body: JSON.stringify(flightData)
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка создания рейса: ${text}`);
  }
  
  return res.json();
}

// Обновление статуса рейса
export async function updateFlightStatus(flightId, payload) {
  const body = typeof payload === "string" ? { status: payload } : payload;

  const res = await fetch(`/api/flights/${flightId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JSON.parse(localStorage.getItem("flightboard_auth") || "{}")?.token || ""}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка обновления статуса: ${text}`);
  }
  return res.json();
}