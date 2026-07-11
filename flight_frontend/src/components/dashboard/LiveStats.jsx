import React, { useEffect, useState } from 'react';

export default function LiveStats({ flights, airlines }) {
  const [stats, setStats] = useState({
    total: 0,
    inAir: 0,
    delayed: 0,
    activeAirlines: 0
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Подсчет статистики
    const inAir = flights.filter(f => f.status === 'in_air').length;
    const delayed = flights.filter(f => f.status === 'delayed').length;
    
    // Уникальные авиакомпании с активными рейсами
    const activeAirlines = new Set(
      flights.filter(f => ['scheduled', 'in_air', 'boarding'].includes(f.status))
        .map(f => f.airline_code)
    );

    setStats({
      total: flights.length,
      inAir,
      delayed,
      activeAirlines: activeAirlines.size
    });
  }, [flights]);

  // Анимация счетчиков
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-stats">
      <div className="stat-item">
        <div className="stat-icon">✈</div>
        <div className="stat-content">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего рейсов</div>
        </div>
        <div className="stat-wave"></div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">🔄</div>
        <div className="stat-content">
          <div className="stat-value">{stats.inAir}</div>
          <div className="stat-label">В воздухе</div>
        </div>
        <div className="stat-pulse"></div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">⚠️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.delayed}</div>
          <div className="stat-label">Задержано</div>
        </div>
        <div className="stat-blink"></div>
      </div>

      <div className="stat-item">
        <div className="stat-icon">🏢</div>
        <div className="stat-content">
          <div className="stat-value">{stats.activeAirlines}</div>
          <div className="stat-label">Активных авиакомпаний</div>
        </div>
        <div className="stat-glow"></div>
      </div>
    </div>
  );
}