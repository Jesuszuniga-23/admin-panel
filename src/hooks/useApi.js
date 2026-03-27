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
  
  // ✅ Validar que apiFunction sea una función
  if (typeof apiFunction !== 'function') {
    console.warn('useApi: apiFunction debe ser una función');
  }

  const execute = useCallback(async (...params) => {
    // ✅ Validar apiFunction nuevamente por si cambió
    if (typeof apiFunction !== 'function') {
      const err = new Error('apiFunction no es una función válida');
      setError(err);
      throw err;
    }
    
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
    setRateLimit(null);

    try {
      const result = await apiFunction(...params, {
        signal: abortControllerRef.current.signal
      });
      setData(result);
      return result;
    } catch (err) {
      // ✅ Manejar tanto AbortError como ERR_CANCELED
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en useApi');
        return null;
      }
      
      console.error("❌ Error en API:", err);

      // Manejar rate limit
      if (err.rateLimit || err.response?.status === 429) {
        const rateLimitInfo = err.rateLimitInfo || {
          retryAfter: 60,
          mensaje: 'Demasiadas peticiones',
          esAdmin: false
        };
        setRateLimit(rateLimitInfo);
        toast.error(rateLimitInfo.mensaje, { duration: 5000 });
        
        // ✅ Auto-retry solo si es admin y está habilitado
        if (options.autoRetry && rateLimitInfo.esAdmin) {
          console.log(`⏱️ Reintentando en ${rateLimitInfo.retryAfter} segundos...`);
          setTimeout(() => {
            // ✅ Limpiar estado de rate limit antes de reintentar
            setRateLimit(null);
            execute(...params);
          }, rateLimitInfo.retryAfter * 1000);
        }
      }

      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options.autoRetry]); // ✅ Agregada dependencia correcta

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición cancelada manualmente');
    }
  }, []);

  const reset = useCallback(() => {
    // Cancelar petición si existe
    abort();
    // ✅ Limpiar referencias
    abortControllerRef.current = null;
    setData(null);
    setError(null);
    setRateLimit(null);
    setLoading(false);
  }, [abort]);

  return {
    data,
    loading,
    error,
    rateLimit,
    execute,
    reset,
    abort, // ✅ Exponer función para cancelar manualmente
    isRateLimited: !!rateLimit // ✅ Indicador de rate limit activo
  };
};

// ✅ Versión para peticiones GET con caché simple
export const useApiWithCache = (apiFunction, cacheKey, options = {}) => {
  const [cachedData, setCachedData] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const { data, loading, error, execute, reset, abort } = useApi(apiFunction, options);
  
  const CACHE_DURATION = options.cacheDuration || 5 * 60 * 1000; // 5 minutos por defecto
  
  const executeWithCache = useCallback(async (...params) => {
    // Verificar caché
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(`${cacheKey}_time`);
      
      if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
        try {
          const cachedDataParsed = JSON.parse(cached);
          setCachedData(cachedDataParsed);
          setIsCached(true);
          return cachedDataParsed;
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    }
    
    setIsCached(false);
    const result = await execute(...params);
    
    // Guardar en caché
    if (result && cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify(result));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    }
    
    return result;
  }, [cacheKey, CACHE_DURATION, execute]);
  
  const clearCache = useCallback(() => {
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(`${cacheKey}_time`);
    }
    setCachedData(null);
    setIsCached(false);
  }, [cacheKey]);
  
  return {
    data: cachedData || data,
    loading,
    error,
    isCached,
    execute: executeWithCache,
    reset,
    abort,
    clearCache
  };
};

// ✅ Versión para peticiones en lote (batch)
export const useBatchApi = (apiFunctions, options = {}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const abortControllersRef = useRef([]);
  
  const executeBatch = useCallback(async (...params) => {
    // Cancelar todas las peticiones anteriores
    abortControllersRef.current.forEach(controller => {
      if (controller) controller.abort();
    });
    abortControllersRef.current = [];
    
    setLoading(true);
    setErrors([]);
    
    const newAbortControllers = [];
    const promises = apiFunctions.map((fn, index) => {
      const abortController = new AbortController();
      newAbortControllers.push(abortController);
      
      return fn(...params, { signal: abortController.signal }).catch(err => {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          console.error(`Error en función ${index}:`, err);
          setErrors(prev => [...prev, { index, error: err }]);
        }
        return null;
      });
    });
    
    abortControllersRef.current = newAbortControllers;
    
    try {
      const batchResults = await Promise.all(promises);
      setResults(batchResults);
      return batchResults;
    } finally {
      setLoading(false);
    }
  }, [apiFunctions]);
  
  const abortAll = useCallback(() => {
    abortControllersRef.current.forEach(controller => {
      if (controller) controller.abort();
    });
    abortControllersRef.current = [];
    setLoading(false);
  }, []);
  
  return {
    results,
    loading,
    errors,
    executeBatch,
    abortAll
  };
};