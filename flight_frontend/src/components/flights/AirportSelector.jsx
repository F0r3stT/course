import React, { useState } from 'react';

export default function AirportSelector({ onSearch }) {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch && departure && arrival) {
      onSearch({ departure, arrival });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Откуда</label>
        <input
          type="text"
          placeholder="SVO"
          value={departure}
          onChange={(e) => setDeparture(e.target.value.toUpperCase())}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Куда</label>
        <input
          type="text"
          placeholder="LED"
          value={arrival}
          onChange={(e) => setArrival(e.target.value.toUpperCase())}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      
      <button 
        type="submit"
        style={{ 
          padding: '8px 16px', 
          background: '#0066cc', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Найти
      </button>
    </form>
  );
}