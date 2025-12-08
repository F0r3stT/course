import React from 'react';

export default function WeatherWidget() {
  const airports = [
    { code: 'SVO', temp: '+2°C', icon: '🌤' },
    { code: 'DME', temp: '+3°C', icon: '☁' },
    { code: 'LED', temp: '+1°C', icon: '🌧' },
  ];

  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px'
    }}>
      <h3 style={{ marginBottom: '15px' }}>Погода в аэропортах</h3>
      <div>
        {airports.map((airport) => (
          <div key={airport.code} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #eee'
          }}>
            <span style={{ fontWeight: 'bold' }}>{airport.code}</span>
            <span>{airport.temp}</span>
            <span>{airport.icon}</span>
          </div>
        ))}
      </div>
    </div>
  );
}