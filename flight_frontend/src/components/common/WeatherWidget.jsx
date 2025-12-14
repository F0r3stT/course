import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./WeatherWidget.css";

const API_BASE = "http://localhost:8080"

// Таймзоны по коду аэропорта (под твой текущий weather_api.py)
const AIRPORT_TZ = {
  SVO: "Europe/Moscow",
  OVB: "Asia/Novosibirsk",
  ANK: "Europe/Istanbul",
  JFK: "America/New_York",
  LHR: "Europe/London",
};

// Fallback в формате, который ожидает UI
const FALLBACK_WEATHER = [
  { code: "SVO", city: "Moscow", temperature: -4, weather: "Облачно", wind_speed: 7, wind_direction: "С", humidity: 86, icon: "☁️" },
  { code: "OVB", city: "Novosibirsk", temperature: -13, weather: "Ясно", wind_speed: 6, wind_direction: "Ю", humidity: 66, icon: "☀️" },
  { code: "ANK", city: "Ankara", temperature: 3, weather: "Облачно с прояснениями", wind_speed: 1, wind_direction: "С", humidity: 87, icon: "⛅" },
  { code: "JFK", city: "New York", temperature: 1, weather: "Небольшая облачность", wind_speed: 8, wind_direction: "СЗ", humidity: 41, icon: "⛅" },
  { code: "LHR", city: "London", temperature: 7, weather: "Ясно", wind_speed: 3, wind_direction: "З", humidity: 91, icon: "☀️" },
];

function formatUpdatedAt(date) {
  if (!date) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatTemp(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${Math.round(n)}°C`;
}

export default function WeatherWidget({ fullBleed = true, title = "Погода в аэропортах" }) {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState("loading"); // loading | online | offline
  const [nowTick, setNowTick] = useState(Date.now());

  const displayNameByCode = useMemo(
    () => ({
      SVO: "Москва",
      OVB: "Новосибирск",
      ANK: "Анкара",
      JFK: "Нью-Йорк",
      LHR: "Лондон",
    }),
    []
  );

  const getAirportDisplayName = useCallback(
    (airport) => displayNameByCode[airport.code] || airport.city || airport.code,
    [displayNameByCode]
  );

  const getLocalTime = useCallback(
    (code) => {
      const tz = AIRPORT_TZ[code];
      if (!tz) return "—";
      return new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
      }).format(new Date(nowTick));
    },
    [nowTick]
  );

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/weather", {
        method: "GET",
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const airports = Array.isArray(data?.airports) ? data.airports : [];

      // Нормализуем Python API поля → UI поля
      const normalized = airports.map((a) => ({
        code: a.airport_code ?? a.code,
        city: a.city,
        temperature: typeof a.temperature === "number" ? a.temperature : Number(a.temperature),
        weather: a.weather,
        wind_speed: a.wind_speed,
        wind_direction: a.wind_direction,
        humidity: a.humidity,
        icon: a.weather_icon ?? a.icon,
      }));

      setWeatherData(normalized.length ? normalized : FALLBACK_WEATHER);
      setLastUpdated(new Date());
      setApiStatus("online");
    } catch (error) {
      console.error("Weather API error:", error);
      setWeatherData(FALLBACK_WEATHER);
      setApiStatus("offline");
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1) Автозагрузка + автообновление
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // 2) Обновление "локального времени" каждые 30 секунд
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className={`weather-widget ${fullBleed ? "weather-widget--bleed" : ""}`}>
      <div className="weather-widget__inner">
        <header className="weather-header-min">
          <div className="weather-title-row">
            <span className="weather-dot" data-status={apiStatus} aria-hidden="true" />
            <h3 className="weather-title-min">{title}</h3>
          </div>

          <div className="weather-meta">
            {lastUpdated ? <span className="weather-updated">Обновлено: {formatUpdatedAt(lastUpdated)}</span> : null}
            <button
              className="weather-refresh-min"
              type="button"
              onClick={fetchWeather}
              disabled={loading}
              aria-label="Обновить погоду"
              title="Обновить"
            >
              ↻
            </button>
          </div>
        </header>

        {loading ? (
          <div className="weather-loading-min">Загрузка погоды…</div>
        ) : (
          <div className="weather-grid-min" role="list">
            {weatherData.map((airport, idx) => {
              const code = airport.code || `airport-${idx}`;
              const name = getAirportDisplayName(airport);
              const wind =
                airport.wind_speed != null
                  ? `${Math.round(airport.wind_speed)} м/с ${airport.wind_direction || ""}`.trim()
                  : null;
              const hum = airport.humidity != null ? `${airport.humidity}%` : null;

              return (
                <div key={code} className="weather-card-min" role="listitem">
                  <div className="weather-card-top">
                    <div className="weather-airport">
                      <span className="weather-airport-code">{airport.code}</span>
                      <span className="weather-airport-city">{name}</span>
                    </div>

                    <div className="weather-temp-block" data-cold={Number(airport.temperature) < 0 ? "1" : "0"}>
                      <span className="weather-temp-min">{formatTemp(airport.temperature)}</span>
                      <span className="weather-icon-min" aria-hidden="true">
                        {airport.icon || "🌤️"}
                      </span>
                    </div>
                  </div>

                  <div className="weather-sub">
                    <div className="weather-condition-min">{airport.weather || "—"}</div>
                    <div className="weather-kpis">
                      {wind ? <span className="weather-kpi">💨 {wind}</span> : null}
                      {hum ? <span className="weather-kpi">💧 {hum}</span> : null}
                      {airport.code ? <span className="weather-kpi">🕒 {getLocalTime(airport.code)}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {apiStatus === "offline" && (
          <div className="weather-warning-min" role="note">
            Данные могут быть неактуальными (используются резервные значения).
          </div>
        )}
      </div>
    </section>
  );
}
