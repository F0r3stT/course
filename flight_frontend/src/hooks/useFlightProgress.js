// src/hooks/useFlightProgress.js
import { useState, useEffect, useCallback } from 'react';

export function useFlightProgress(departureTime, arrivalTime, isActive = true) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const calculateProgress = useCallback(() => {
    const now = Date.now();
    const start = new Date(departureTime).getTime();
    const end = new Date(arrivalTime).getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  }, [departureTime, arrivalTime]);

  const calculateTimeRemaining = useCallback(() => {
    const now = new Date();
    const end = new Date(arrivalTime);
    
    if (now > end) return null;
    
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: diffHours, minutes: diffMinutes };
  }, [arrivalTime]);

  useEffect(() => {
    if (!isActive) return;
    
    // Инициализация
    setProgress(calculateProgress());
    setTimeRemaining(calculateTimeRemaining());
    
    // Интервал для обновления
    const interval = setInterval(() => {
      setProgress(calculateProgress());
      setTimeRemaining(calculateTimeRemaining());
    }, 60000); // Каждую минуту
    
    return () => clearInterval(interval);
  }, [departureTime, arrivalTime, isActive, calculateProgress, calculateTimeRemaining]);

  return { progress, timeRemaining };
}