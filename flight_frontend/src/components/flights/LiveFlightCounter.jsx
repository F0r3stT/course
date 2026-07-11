import React from 'react';

export default function LiveFlightCounter() {
  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '10px' }}>Рейсы онлайн</h3>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0066cc' }}>
        1,245
      </div>
      <p style={{ color: '#666' }}>Самолетов в воздухе</p>
    </div>
  );
}