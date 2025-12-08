import React from 'react';

export default function SecurityBadge() {
  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '8px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
      <h3 style={{ marginBottom: '10px' }}>Уровень безопасности</h3>
      <div style={{ 
        background: '#28a745', 
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        display: 'inline-block',
        fontWeight: 'bold',
        marginBottom: '10px'
      }}>
        ВЫСОКИЙ
      </div>
      <p style={{ color: '#666' }}>Все системы защищены</p>
    </div>
  );
}