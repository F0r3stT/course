import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAudit = () => {
  const logAudit = (action, details = {}) => {
    console.log(`[AUDIT] ${action}:`, details);
    return Promise.resolve();
  };

  const logFlightEvent = (action, flightId, details = {}) => {
    return logAudit(`flight_${action}`, {
      flight_id: flightId,
      ...details,
    });
  };

  const logAuthEvent = (action, success = true, details = {}) => {
    return logAudit(`auth_${action}`, {
      success,
      ...details,
    });
  };

  return {
    logAudit,
    logFlightEvent,
    logAuthEvent,
  };
};