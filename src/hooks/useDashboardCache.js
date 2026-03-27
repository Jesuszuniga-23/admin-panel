// src/hooks/useDashboardCache.js
import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/admin/dashboard.service';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const CACHE_KEY = 'dashboard_cache';
const CACHE_TIME_KEY = 'dashboard_cache_time';

export const useDashboardCache = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  
  // ✅ Ref para mantener el AbortController activo
  const abortControllerRef = useRef(null);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    // ✅ Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en useDashboardCache');
    }
    
    // Verificar caché si no se fuerza recarga
    if (!forceRefresh) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        
        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          setData(parsedData);
          setCached(true);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (parseError) {
        console.error('Error parsing cached data:', parseError);
        // ✅ Limpiar caché corrupta
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
      }
    }
    
    setLoading(true);
    setError(null);
    setCached(false);
    
    // ✅ Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await dashboardService.obtenerDashboardCompleto({
        signal: abortControllerRef.current.signal
      });
      
      if (response.success && response.data) {
        setData(response.data);
        // Guardar en caché
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } else if (response.aborted) {
        console.log('📡 Petición cancelada');
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      // ✅ Manejar tanto AbortError como ERR_CANCELED
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada');
        return;
      }
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const recargar = useCallback(() => {
    return cargarDatos(true);
  }, [cargarDatos]);

  // ✅ Limpiar caché manualmente
  const limpiarCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    console.log('🧹 Caché del dashboard limpiada');
  }, []);

  // ✅ Cargar datos al montar con limpieza
  useEffect(() => {
    cargarDatos();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente desmontado - petición cancelada');
      }
    };
  }, [cargarDatos]);

  return {
    data,
    loading,
    error,
    cached,
    recargar,
    limpiarCache // ✅ Exponer función para limpiar caché manualmente
  };
};

// ✅ Versión con múltiples cachés (para diferentes endpoints)
export const useMultiCache = (cacheConfigs = {}) => {
  const [caches, setCaches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllersRef = useRef({});

  const cargarTodos = useCallback(async (forceRefresh = false) => {
    // Cancelar todas las peticiones anteriores
    Object.values(abortControllersRef.current).forEach(controller => {
      if (controller) controller.abort();
    });
    abortControllersRef.current = {};
    
    setLoading(true);
    setError(null);
    
    const results = {};
    const promises = Object.entries(cacheConfigs).map(async ([key, config]) => {
      // Verificar caché
      if (!forceRefresh) {
        try {
          const cachedData = localStorage.getItem(config.cacheKey);
          const cachedTime = localStorage.getItem(`${config.cacheKey}_time`);
          
          if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < (config.duration || 5 * 60 * 1000)) {
            results[key] = JSON.parse(cachedData);
            return;
          }
        } catch (e) {
          console.error(`Error parsing cache for ${key}:`, e);
        }
      }
      
      // Crear AbortController para esta petición
      const abortController = new AbortController();
      abortControllersRef.current[key] = abortController;
      
      try {
        const response = await config.service(...config.params, {
          signal: abortController.signal
        });
        
        if (response.success) {
          results[key] = response.data;
          // Guardar en caché
          localStorage.setItem(config.cacheKey, JSON.stringify(response.data));
          localStorage.setItem(`${config.cacheKey}_time`, Date.now().toString());
        } else {
          results[key] = null;
        }
      } catch (err) {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          console.error(`Error loading ${key}:`, err);
          results[key] = null;
        }
      }
    });
    
    await Promise.all(promises);
    setCaches(results);
    setLoading(false);
  }, [cacheConfigs]);
  
  const recargar = useCallback(() => cargarTodos(true), [cargarTodos]);
  
  const limpiarCache = useCallback((key = null) => {
    if (key) {
      const config = cacheConfigs[key];
      if (config) {
        localStorage.removeItem(config.cacheKey);
        localStorage.removeItem(`${config.cacheKey}_time`);
      }
    } else {
      Object.values(cacheConfigs).forEach(config => {
        localStorage.removeItem(config.cacheKey);
        localStorage.removeItem(`${config.cacheKey}_time`);
      });
    }
  }, [cacheConfigs]);
  
  useEffect(() => {
    cargarTodos();
    
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, [cargarTodos]);
  
  return {
    caches,
    loading,
    error,
    recargar,
    limpiarCache
  };
};

// ✅ Versión con polling automático
export const usePollingCache = (options = {}) => {
  const { 
    interval = 30000, // 30 segundos por defecto
    enabled = true,
    ...cacheOptions 
  } = options;
  
  const { data, loading, error, cached, recargar, limpiarCache } = useDashboardCache(cacheOptions);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    intervalRef.current = setInterval(() => {
      console.log('🔄 Polling: recargando datos...');
      recargar();
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, recargar]);
  
  return {
    data,
    loading,
    error,
    cached,
    recargar,
    limpiarCache,
    isPolling: enabled
  };
};