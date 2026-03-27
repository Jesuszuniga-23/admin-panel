// src/hooks/useApi.js
import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { checkRateLimit } from '../services/api/axiosConfig';

export const useApi = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimit, setRateLimit] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(async (...params) => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    // Verificar rate limit antes de ejecutar
    const rateLimitActive = checkRateLimit();
    if (rateLimitActive) {
      const rateLimitError = {
        rateLimit: true,
        message: rateLimitActive.mensaje,
        timeLeft: Math.ceil((rateLimitActive.expira - Date.now()) / 1000)
      };
      setRateLimit(rateLimitError);
      throw rateLimitError;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...params, {
        signal: abortControllerRef.current.signal
      });
      setData(result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Petición cancelada');
        return null;
      }
      
      console.error("Error en API:", err);

      if (err.rateLimit || err.response?.status === 429) {
        const rateLimitInfo = err.rateLimitInfo || {
          retryAfter: 60,
          mensaje: 'Demasiadas peticiones'
        };
        setRateLimit(rateLimitInfo);
        toast.error(rateLimitInfo.mensaje, { duration: 5000 });
        
        if (options.autoRetry && rateLimitInfo.esAdmin) {
          setTimeout(() => execute(...params), rateLimitInfo.retryAfter * 1000);
        }
      }

      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options.autoRetry]);

  const reset = useCallback(() => {
    // Cancelar petición si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setData(null);
    setError(null);
    setRateLimit(null);
  }, []);

  return {
    data,
    loading,
    error,
    rateLimit,
    execute,
    reset
  };
};