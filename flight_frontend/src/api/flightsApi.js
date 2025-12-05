// src/api/flightsApi.js
const API_BASE = "http://localhost:8080";

// Читаем токен из localStorage — тот же ключ, который ставит AuthContext
function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Получить список рейсов (публично)
export async function fetchFlights() {
  const res = await fetch(`${API_BASE}/api/flights`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка загрузки рейсов (HTTP ${res.status}): ${text}`);
  }
  return res.json();
}

// Создать новый рейс (нужна авторизация)
export async function createFlight(form) {
  const {
    flightNumber,
    airlineCode,
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
    status,
  } = form;

  // Простая проверка
  if (
    !flightNumber ||
    !airlineCode ||
    !departureAirport ||
    !arrivalAirport ||
    !departureTime ||
    !arrivalTime ||
    !status
  ) {
    throw new Error("Заполните все поля формы");
  }

  if (airlineCode.length !== 2) {
    throw new Error("Аббревиатура авиакомпании должна быть из 2 символов");
  }


  const depDate = new Date(departureTime);
  const arrDate = new Date(arrivalTime);

  if (isNaN(depDate.getTime()) || isNaN(arrDate.getTime())) {
    throw new Error("Некорректный формат времени вылета/прилёта");
  }

  const payload = {
    flight_number: flightNumber,
    departure_airport: departureAirport.toUpperCase(),
    arrival_airport: arrivalAirport.toUpperCase(),
    departure_time: depDate.toISOString(),
    arrival_time: arrDate.toISOString(),
    status,
  };

  const res = await fetch(`${API_BASE}/api/flights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка создания рейса (HTTP ${res.status}): ${text}`);
  }

  return res.json();
}

// Обновить только статус рейса (PATCH /api/flights/:id/status)
export async function updateFlightStatus(id, newStatus) {
  if (!newStatus) {
    throw new Error("Статус не может быть пустым");
  }

  const res = await fetch(`${API_BASE}/api/flights/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ status: newStatus }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка обновления статуса (HTTP ${res.status}): ${text}`);
  }

  return res.json();
}

// Удалить рейс (DELETE /api/flights/:id)
export async function deleteFlight(id) {
  const res = await fetch(`${API_BASE}/api/flights/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (res.status === 204) {
    return;
  }

  if (res.status === 404) {
    throw new Error("Рейс не найден");
  }

  const text = await res.text();
  throw new Error(`Ошибка удаления рейса (HTTP ${res.status}): ${text}`);
}

// Обновить рейс целиком (PUT /api/flights/:id)
export async function updateFlight(id, form) {
  const {
    flightNumber,
    airlineCode,
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
    status,
  } = form;

  if (
    !flightNumber ||
    !airlineCode ||
    !departureAirport ||
    !arrivalAirport ||
    !departureTime ||
    !arrivalTime ||
    !status
  ) {
    throw new Error("Заполните все поля формы");
  }

  if (airlineCode.length !== 2) {
    throw new Error("Аббревиатура авиакомпании должна быть из 2 символов");
  }

  const depDate = new Date(departureTime);
  const arrDate = new Date(arrivalTime);

  if (isNaN(depDate.getTime()) || isNaN(arrDate.getTime())) {
    throw new Error("Некорректный формат времени вылета/прилёта");
  }

  const payload = {
    flight_number: flightNumber,
    departure_airport: departureAirport.toUpperCase(),
    arrival_airport: arrivalAirport.toUpperCase(),
    departure_time: depDate.toISOString(),
    arrival_time: arrDate.toISOString(),
    status,
  };

  const res = await fetch(`${API_BASE}/api/flights/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ошибка обновления рейса (HTTP ${res.status}): ${text}`);
  }

  return res.json();
}
