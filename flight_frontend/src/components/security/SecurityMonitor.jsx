import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SecurityMonitor() {
  const { user } = useAuth();
  const [securityLevel, setSecurityLevel] = useState('high');
  const [lastActivity, setLastActivity] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastActivity(new Date());
    }, 60000); // Обновление каждую минуту

    return () => clearInterval(interval);
  }, []);

  const getSecurityColor = (level) => {
    switch(level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSecurityText = () => {
    if (!user) return 'Гостевой режим';
    if (user.role === 'admin') return 'Администратор';
    if (user.role === 'staff') return 'Персонал';
    return 'Наблюдатель';
  };

  return (
    <div className="security-monitor">
      <div className="security-badge">
        <div 
          className="security-level"
          style={{ '--security-color': getSecurityColor(securityLevel) }}
        >
          <div className="security-dot"></div>
          <span>{getSecurityText()}</span>
        </div>
        <div className="security-info">
          <div className="info-item">
            <span className="info-label">Последняя активность:</span>
            <span className="info-value">
              {lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Шифрование:</span>
            <span className="info-value">TLS 1.3</span>
          </div>
        </div>
      </div>
    </div>
  );
}