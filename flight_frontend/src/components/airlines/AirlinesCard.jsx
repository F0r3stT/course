import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AirlineCard({ airline, flights = [] }) {
  const navigate = useNavigate();
  
  const getStatusCount = (status) => {
    return flights.filter(f => f.status === status).length;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#3b82f6',
      'in_air': '#10b981',
      'delayed': '#f59e0b',
      'cancelled': '#ef4444',
      'landed': '#8b5cf6',
      'boarding': '#ec4899'
    };
    return colors[status] || '#6b7280';
  };
  
  const handleClick = () => {
    navigate(`/airlines/${airline.code}`);
  };

  return (
    <div 
      className="airline-card"
      onClick={handleClick}
      style={{ '--airline-color': getStatusColor('scheduled') }}
    >
      <div className="airline-header">
        <div className="airline-logo">
          <span className="logo-icon">✈</span>
        </div>
        <div className="airline-info">
          <h3 className="airline-name">{airline.name}</h3>
          <div className="airline-code">{airline.code}</div>
        </div>
        <div className="airline-stats">
          <div className="stat-total">{airline.total || flights.length}</div>
          <div className="stat-label">рейсов</div>
        </div>
      </div>
      
      <div className="airline-status">
        {['scheduled', 'in_air', 'delayed'].map(status => (
          <div key={status} className="status-item">
            <div 
              className="status-dot"
              style={{ backgroundColor: getStatusColor(status) }}
            ></div>
            <span className="status-label">
              {status === 'scheduled' ? 'По расписанию' :
               status === 'in_air' ? 'В воздухе' :
               status === 'delayed' ? 'Задержано' : status}
            </span>
            <span className="status-count">{getStatusCount(status)}</span>
          </div>
        ))}
      </div>
      
      <div className="airline-flights">
        <div className="flights-list">
          {flights.slice(0, 3).map(flight => (
            <div key={flight.id} className="flight-item">
              <span className="flight-number">{flight.flight_number}</span>
              <div className="flight-route">
                <span>{flight.departure_airport}</span>
                <span className="arrow">→</span>
                <span>{flight.arrival_airport}</span>
              </div>
              <span className={`flight-status status-${flight.status}`}>
                {flight.status}
              </span>
            </div>
          ))}
        </div>
        {flights.length > 3 && (
          <div className="more-flights">
            +{flights.length - 3} еще
          </div>
        )}
      </div>
    </div>
  );
}