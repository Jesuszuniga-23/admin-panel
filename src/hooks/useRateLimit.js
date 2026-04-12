import { useState, useEffect, useCallback, useRef } from 'react';
import { checkRateLimit } from '../services/api/axiosConfig';

export const useRateLimit = () => {
  const [rateLimit, setRateLimit] = useState(checkRateLimit());
  const [timeLeft, setTimeLeft] = useState(null);
  const intervalRef = useRef(null);

  //  Función para actualizar rate limit desde localStorage
  const actualizarDesdeStorage = useCallback(() => {
    const nuevoRateLimit = checkRateLimit();
    setRateLimit(nuevoRateLimit);
    if (!nuevoRateLimit) {
      setTimeLeft(null);
    }
  }, []);

  // Escuchar cambios en localStorage (sincronización entre pestañas)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'rate_limit_info') {
        if (e.newValue) {
          try {
            const nuevoRateLimit = JSON.parse(e.newValue);
            setRateLimit(nuevoRateLimit);
          } catch (err) {
            console.error('Error parsing rate_limit_info:', err);
            setRateLimit(null);
          }
        } else {
          setRateLimit(null);
          setTimeLeft(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  //  Escuchar eventos personalizados
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

  //  Intervalo para actualizar tiempo restante
  useEffect(() => {
    // Limpiar intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (!rateLimit) {
      setTimeLeft(null);
      return;
    }
    
    //  Calcular tiempo inicial
    const calcularTiempoRestante = () => {
      const remaining = Math.max(0, Math.ceil((rateLimit.expira - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      //  Si el tiempo expiró, limpiar automáticamente
      if (remaining <= 0) {
        setRateLimit(null);
        localStorage.removeItem('rate_limit_info');
        //  Disparar evento para notificar a otras partes de la app
        window.dispatchEvent(new CustomEvent('rate-limit-cleared'));
        return true; // Indica que expiró
      }
      return false; // No expiró
    };
    
    // Ejecutar inmediatamente
    const expirado = calcularTiempoRestante();
    if (expirado) return;
    
    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      const expirado = calcularTiempoRestante();
      if (expirado && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [rateLimit]);

  //  Formatear tiempo con mejor formato
  const formatTime = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '0s';
    if (seconds <= 0) return '0s';
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    const horas = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  }, []);

  // Formatear tiempo para mostrar en UI
  const formatTimeForUI = useCallback((seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    if (seconds <= 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  //  Calcular porcentaje de tiempo transcurrido (para barra de progreso)
  const getProgressPercentage = useCallback(() => {
    if (!rateLimit?.retryAfter || !timeLeft) return 0;
    const total = rateLimit.retryAfter;
    const elapsed = total - timeLeft;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [rateLimit?.retryAfter, timeLeft]);

  //  Función para forzar actualización (útil después de recargar página)
  const refresh = useCallback(() => {
    actualizarDesdeStorage();
  }, [actualizarDesdeStorage]);

  //  Función para limpiar manualmente el rate limit (para pruebas)
  const clear = useCallback(() => {
    localStorage.removeItem('rate_limit_info');
    setRateLimit(null);
    setTimeLeft(null);
    window.dispatchEvent(new CustomEvent('rate-limit-cleared'));
  }, []);

  return {
    isLimited: !!rateLimit,
    timeLeft,
    timeFormatted: formatTime(timeLeft),
    timeFormattedUI: formatTimeForUI(timeLeft),
    message: rateLimit?.mensaje,
    esAdmin: rateLimit?.esAdmin,
    retryAfter: rateLimit?.retryAfter,
    progressPercentage: getProgressPercentage(),
    refresh,
    clear
  };
};

//  Versión con contador de reintentos (para componentes que necesitan reintentar automáticamente)
export const useRateLimitWithRetry = (onRetry, options = {}) => {
  const { maxRetries = 3, retryDelay = 2000 } = options;
  const rateLimit = useRateLimit();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef(null);

  //  Cancelar reintento pendiente al desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const attemptRetry = useCallback(() => {
    if (!rateLimit.isLimited) {
      if (retryCount < maxRetries) {
        setIsRetrying(true);
        toast.loading(`Reintentando (${retryCount + 1}/${maxRetries})...`, { id: 'rate-limit-retry' });
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setIsRetrying(false);
          toast.dismiss('rate-limit-retry');
          
          if (onRetry) {
            onRetry();
          }
        }, retryDelay);
      } else {
        toast.error('Máximo de reintentos alcanzado. Espera un momento.', { id: 'rate-limit-max' });
      }
    }
  }, [rateLimit.isLimited, retryCount, maxRetries, retryDelay, onRetry]);

  //  Resetear contador cuando se limpia el rate limit
  useEffect(() => {
    if (!rateLimit.isLimited) {
      setRetryCount(0);
      setIsRetrying(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    }
  }, [rateLimit.isLimited]);

  return {
    ...rateLimit,
    retryCount,
    isRetrying,
    attemptRetry,
    canRetry: rateLimit.isLimited && retryCount < maxRetries
  };
};

//  Versión con barra de progreso animada (para UI)
export const useRateLimitProgress = () => {
  const rateLimit = useRateLimit();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!rateLimit.isLimited || !rateLimit.retryAfter) {
      setProgress(0);
      return;
    }
    
    const total = rateLimit.retryAfter;
    const updateProgress = () => {
      const elapsed = total - (rateLimit.timeLeft || 0);
      const newProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
      setProgress(newProgress);
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 100);
    
    return () => clearInterval(interval);
  }, [rateLimit.isLimited, rateLimit.retryAfter, rateLimit.timeLeft]);
  
  return {
    ...rateLimit,
    progress,
    progressPercentage: `${Math.round(progress)}%`
  };
};