import React, { useEffect, useState } from "react";
import "./AnimatedStats.css";

export default function AnimatedStats({ stats }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Анимация заполнения
    const timer = setTimeout(() => {
      setProgress(100);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Вычисляем процент рейсов в воздухе для анимации самолёта
  const activePercentage = stats.totalFlights > 0 
    ? (stats.activeFlights / stats.totalFlights) * 100 
    : 0;

  return (
    <div className="animated-stats-container">
      <div className="stats-hero">
        {/* Анимированная дорожка с самолётом */}
        <div className="flight-track">
          <div className="track-line">
            <div 
              className="animated-plane"
              style={{ 
                left: `${progress}%`,
                transition: `left ${progress * 50}ms ease-in-out`
              }}
            >
              ✈
              <div className="plane-tooltip">
                В воздухе: {stats.activeFlights} рейсов
              </div>
            </div>
          </div>
          
          <div className="track-markers">
            <span className="marker marker-start">0%</span>
            <span className="marker marker-middle">50%</span>
            <span 
              className="marker marker-active"
              style={{ left: `${activePercentage}%` }}
            >
              {Math.round(activePercentage)}% активных
            </span>
            <span className="marker marker-end">100%</span>
          </div>
        </div>
        
        {/* Основная статистика с анимациями */}
          
        </div>
      </div>
  );
}

function StatCard({ icon, value, label, color, animation, highlight = false }) {
  return (
    <div className={`stat-card-animated ${highlight ? 'highlight' : ''}`}>
      <div className="stat-card-inner">
        <div 
          className="stat-icon-animated"
          style={{ color }}
          data-animation={animation}
        >
          {icon}
        </div>
        <div className="stat-content-animated">
          <div 
            className="stat-value-animated"
            style={{ color }}
          >
            {value}
          </div>
          <div className="stat-label-animated">{label}</div>
        </div>
        {highlight && <div className="active-badge">СЕЙЧАС</div>}
      </div>
      <div className="stat-wave" style={{ backgroundColor: `${color}20` }}></div>
    </div>
  );
}