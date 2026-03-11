import { useState, useEffect } from 'react';
import { checkRateLimit } from '../services/api/axiosConfig';

export const useRateLimit = () => {
  const [rateLimit, setRateLimit] = useState(checkRateLimit());
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const handleRateLimitActivated = (event) => {
      setRateLimit(event.detail);
    };

    const handleRateLimitCleared = () => {
      setRateLimit(null);
      setTimeLeft(null);
    };

    window.addEventListener('rate-limit-activated', handleRateLimitActivated);
    window.addEventListener('rate-limit-cleared', handleRateLimitCleared);

    return () => {
      window.removeEventListener('rate-limit-activated', handleRateLimitActivated);
      window.removeEventListener('rate-limit-cleared', handleRateLimitCleared);
    };
  }, []);

  useEffect(() => {
    if (!rateLimit) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((rateLimit.expira - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setRateLimit(null);
        localStorage.removeItem('rate_limit_info');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimit]);

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return {
    isLimited: !!rateLimit,
    timeLeft,
    timeFormatted: formatTime(timeLeft),
    message: rateLimit?.mensaje,
    esAdmin: rateLimit?.esAdmin,
    retryAfter: rateLimit?.retryAfter
  };
};