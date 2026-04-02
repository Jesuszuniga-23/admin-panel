// src/hooks/useDashboardCache.js - CORREGIDO
import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/admin/dashboard.service';
import useAuthStore from '../store/authStore';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useDashboardCache = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  
  // ✅ Obtener usuario actual del store
  const { user } = useAuthStore();
  
  // ✅ Ref para mantener el AbortController activo
  const abortControllerRef = useRef(null);

  // ✅ GENERAR CLAVE ÚNICA POR USUARIO (basada en ID y rol)
  const getCacheKey = useCallback(() => {
    if (!user?.id) return null;
    return `dashboard_cache_${user.id}_${user.rol}`;
  }, [user?.id, user?.rol]);
  
  const getCacheTimeKey = useCallback(() => {
    if (!user?.id) return null;
    return `dashboard_cache_time_${user.id}_${user.rol}`;
  }, [user?.id, user?.rol]);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    // ✅ Si no hay usuario, no hacer nada
    if (!user?.id) {
      console.log('⏳ Esperando usuario...');
      setLoading(false);
      return;
    }
    
    const cacheKey = getCacheKey();
    const cacheTimeKey = getCacheTimeKey();
    
    // ✅ Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en useDashboardCache');
    }
    
    // Verificar caché si no se fuerza recarga
    if (!forceRefresh && cacheKey && cacheTimeKey) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        
        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          console.log(`📦 Usando caché para usuario ${user.rol} (ID: ${user.id})`);
          setData(parsedData);
          setCached(true);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (parseError) {
        console.error('Error parsing cached data:', parseError);
        // Limpiar caché corrupta
        if (cacheKey) localStorage.removeItem(cacheKey);
        if (cacheTimeKey) localStorage.removeItem(cacheTimeKey);
      }
    }
    
    setLoading(true);
    setError(null);
    setCached(false);
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      console.log(`📡 Cargando dashboard para usuario ${user.rol} (ID: ${user.id})...`);
      
      const response = await dashboardService.obtenerDashboardCompleto({
        signal: abortControllerRef.current.signal
      });
      
      if (response.success && response.data) {
        console.log(`✅ Dashboard cargado para ${user.rol}: Personal: ${response.data.personal?.total}, Unidades: ${response.data.unidades?.total}`);
        setData(response.data);
        // Guardar en caché con clave específica del usuario
        if (cacheKey && cacheTimeKey) {
          localStorage.setItem(cacheKey, JSON.stringify(response.data));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        }
      } else if (response.aborted) {
        console.log('📡 Petición cancelada');
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      // Manejar tanto AbortError como ERR_CANCELED
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada');
        return;
      }
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [user, getCacheKey, getCacheTimeKey]);

  const recargar = useCallback(() => {
    console.log('🔄 Recargando dashboard (force refresh)...');
    return cargarDatos(true);
  }, [cargarDatos]);

  // ✅ Limpiar caché del usuario actual
  const limpiarCache = useCallback(() => {
    const cacheKey = getCacheKey();
    const cacheTimeKey = getCacheTimeKey();
    if (cacheKey) localStorage.removeItem(cacheKey);
    if (cacheTimeKey) localStorage.removeItem(cacheTimeKey);
    console.log(`🧹 Caché del dashboard limpiada para usuario ${user?.rol} (ID: ${user?.id})`);
  }, [getCacheKey, getCacheTimeKey, user]);

  // ✅ Limpiar caché al cambiar de usuario (efecto crítico)
  useEffect(() => {
    if (user?.id) {
      console.log(`👤 Usuario cambiado a ${user.rol} (ID: ${user.id}), recargando dashboard...`);
      cargarDatos(true); // Force refresh al cambiar de usuario
    }
  }, [user?.id, user?.rol, cargarDatos]);

  // ✅ Cargar datos al montar con limpieza
  useEffect(() => {
    if (user?.id) {
      cargarDatos();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente desmontado - petición cancelada');
      }
    };
  }, [cargarDatos, user?.id]);

  return {
    data,
    loading,
    error,
    cached,
    recargar,
    limpiarCache
  };
};

// =====================================================
// useMultiCache - CORREGIDO
// =====================================================
export const useMultiCache = (cacheConfigs = {}) => {
  const [caches, setCaches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllersRef = useRef({});
  
  // ✅ Obtener usuario actual
  const { user } = useAuthStore();

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
      // ✅ Generar clave de caché por usuario
      const userCacheKey = user?.id ? `${config.cacheKey}_${user.id}_${user.rol}` : config.cacheKey;
      const userCacheTimeKey = user?.id ? `${config.cacheKey}_time_${user.id}_${user.rol}` : `${config.cacheKey}_time`;
      
      // Verificar caché
      if (!forceRefresh) {
        try {
          const cachedData = localStorage.getItem(userCacheKey);
          const cachedTime = localStorage.getItem(userCacheTimeKey);
          
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
          // Guardar en caché con clave por usuario
          localStorage.setItem(userCacheKey, JSON.stringify(response.data));
          localStorage.setItem(userCacheTimeKey, Date.now().toString());
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
  }, [cacheConfigs, user]);
  
  const recargar = useCallback(() => cargarTodos(true), [cargarTodos]);
  
  const limpiarCache = useCallback((key = null) => {
    if (key) {
      const config = cacheConfigs[key];
      if (config) {
        const userCacheKey = user?.id ? `${config.cacheKey}_${user.id}_${user.rol}` : config.cacheKey;
        const userCacheTimeKey = user?.id ? `${config.cacheKey}_time_${user.id}_${user.rol}` : `${config.cacheKey}_time`;
        localStorage.removeItem(userCacheKey);
        localStorage.removeItem(userCacheTimeKey);
      }
    } else {
      Object.values(cacheConfigs).forEach(config => {
        const userCacheKey = user?.id ? `${config.cacheKey}_${user.id}_${user.rol}` : config.cacheKey;
        const userCacheTimeKey = user?.id ? `${config.cacheKey}_time_${user.id}_${user.rol}` : `${config.cacheKey}_time`;
        localStorage.removeItem(userCacheKey);
        localStorage.removeItem(userCacheTimeKey);
      });
    }
  }, [cacheConfigs, user]);
  
  useEffect(() => {
    if (user?.id) {
      cargarTodos(true); // Force refresh al cambiar usuario
    } else {
      cargarTodos();
    }
    
    return () => {
      Object.values(abortControllersRef.current).forEach(controller => {
        if (controller) controller.abort();
      });
    };
  }, [cargarTodos, user]);
  
  return {
    caches,
    loading,
    error,
    recargar,
    limpiarCache
  };
};

// =====================================================
// usePollingCache - CORREGIDO
// =====================================================
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