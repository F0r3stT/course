// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';


import { fetchFlights, fetchAirlines, updateFlightStatus } from '../api/flightsApi';

import './Dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('flights');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flightsData, airlinesData] = await Promise.all([
        fetchFlights(),
        fetchAirlines(),
      ]);
      setFlights(flightsData);
      setAirlines(airlinesData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  async function handleChangeStatus(flightId, newStatus) {
    try {
      setStatusUpdatingId(flightId);
      await updateFlightStatus(flightId, newStatus);

      // Обновляем локальное состояние, чтобы сразу увидеть изменения
      setFlights((prev) =>
        prev.map((f) =>
          f.id === flightId ? { ...f, status: newStatus } : f
        )
      );
    } catch (err) {
      console.error('Error updating flight status:', err);
      alert(err.message || 'Ошибка обновления статуса рейса');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Загрузка данных о рейсах...</p>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✈</span>
            <h1>FlightBoard Pro</h1>
            <p className="subtitle">Система мониторинга авиарейсов</p>
          </div>

          <div className="user-section">
            {user ? (
              <>
                <div className="user-info">
                  <span className="user-name">{user.username}</span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={logout} className="btn-logout">
                  Выйти
                </button>
              </>
            ) : (
              <div className="guest-notice">Гостевой режим</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'flights' ? 'active' : ''}`}
            onClick={() => setActiveTab('flights')}
          >
            ✈ Все рейсы
          </button>
          <button
            className={`tab ${activeTab === 'airlines' ? 'active' : ''}`}
            onClick={() => setActiveTab('airlines')}
          >
            🏢 Авиакомпании
          </button>
          <button
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Статистика
          </button>
        </nav>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-value">{flights.length}</div>
          <div className="stat-label">Всего рейсов</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {flights.filter((f) => f.status === 'in_air').length}
          </div>
          <div className="stat-label">В воздухе</div>
        </div>
        <div className="stat">
          <div className="stat-value">{airlines.length}</div>
          <div className="stat-label">Авиакомпаний</div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {flights.filter((f) => f.status === 'delayed').length}
          </div>
          <div className="stat-label">Задержано</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'flights' && (
          <div className="flights-grid">
            {flights.map((flight) => (
              <div key={flight.id} className="flight-card">
                <div className="flight-header">
                  <div className="flight-airline">
                    <span className="airline-code">{flight.airline_code}</span>
                    <span className="airline-name">{flight.airline_name}</span>
                  </div>

                  <div className={`flight-status status-${flight.status}`}>
                    {getStatusText(flight.status)}
                  </div>
                </div>

                <div className="flight-number">
                  Рейс {flight.flight_number}
                </div>

                <div className="flight-route">
                  <div className="route-segment">
                    <div className="airport-code">
                      {flight.departure_airport}
                    </div>
                    <div className="time">
                      {formatTime(flight.departure_time)}
                    </div>
                  </div>

                  <div className="route-line">
                    <div className="line"></div>
                    <div className="plane">✈</div>
                  </div>

                  <div className="route-segment">
                    <div className="airport-code">
                      {flight.arrival_airport}
                    </div>
                    <div className="time">
                      {formatTime(flight.arrival_time)}
                    </div>
                  </div>
                </div>

                <div className="flight-footer">
                  <div className="duration">
                    {flight.flight_duration_minutes} мин
                  </div>
                  <div className="flight-id">#{flight.id}</div>
                </div>

                {/* Блок редактирования статуса доступен только админу */}
                {isAdmin && (
                  <div className="flight-admin-controls">
                    <label>
                      Статус:
                      <select
                        value={flight.status || 'scheduled'}
                        disabled={statusUpdatingId === flight.id}
                        onChange={(e) =>
                          handleChangeStatus(flight.id, e.target.value)
                        }
                      >
                        <option value="scheduled">По расписанию</option>
                        <option value="boarding">Посадка</option>
                        <option value="in_air">В полёте</option>
                        <option value="landed">Прибыл</option>
                        <option value="delayed">Задержан</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'airlines' && (
          <div className="airlines-grid">
            {airlines.map((airline) => {
              const airlineFlights = flights.filter(
                (f) => f.airline_code === airline.code
              );
              return (
                <div key={airline.code} className="airline-card">
                  <div className="airline-header">
                    <div className="airline-logo">{airline.code}</div>
                    <div className="airline-info">
                      <h3>{airline.name}</h3>
                      <p>{airlineFlights.length} рейсов</p>
                    </div>
                  </div>

                  <div className="airline-stats">
                    <div className="stat">
                      <span>В воздухе:</span>
                      <span>
                        {
                          airlineFlights.filter(
                            (f) => f.status === 'in_air'
                          ).length
                        }
                      </span>
                    </div>
                    <div className="stat">
                      <span>По расписанию:</span>
                      <span>
                        {
                          airlineFlights.filter(
                            (f) => f.status === 'scheduled'
                          ).length
                        }
                      </span>
                    </div>
                    <div className="stat">
                      <span>Задержано:</span>
                      <span>
                        {
                          airlineFlights.filter(
                            (f) => f.status === 'delayed'
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-content">
            <h2>Статистика системы</h2>
            <div className="charts-placeholder">
              <p>Здесь будут графики и аналитика</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="system-info">
          <span className="status-indicator online"></span>
          Система активна • Последнее обновление:{' '}
          {new Date().toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}

function getStatusText(status) {
  const statusMap = {
    scheduled: 'По расписанию',
    boarding: 'Посадка',
    in_air: 'В воздухе',
    landed: 'Приземлился',
    delayed: 'Задержан',
    cancelled: 'Отменен',
  };
  return statusMap[status] || status;
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
