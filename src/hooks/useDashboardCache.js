import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardService from '../services/admin/dashboard.service';
import useAuthStore from '../store/authStore';
import { obtenerTenantActual } from '../utils/storage';  

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useDashboardCache = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const { user } = useAuthStore();
  const abortControllerRef = useRef(null);

  const getCacheKey = useCallback(() => {
    if (!user?.id) return null;
    const tenantId = obtenerTenantActual();
    return `dashboard_cache_${user.id}_${user.rol}_${tenantId}`; 
  }, [user?.id, user?.rol]);

  const getCacheTimeKey = useCallback(() => {
    if (!user?.id) return null;
    const tenantId = obtenerTenantActual();
    return `dashboard_cache_time_${user.id}_${user.rol}_${tenantId}`;  
  }, [user?.id, user?.rol]);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const tenantId = obtenerTenantActual();
    console.log(` Cargando dashboard | Usuario: ${user.rol} (${user.id}) | Tenant: ${tenantId}`);

    const cacheKey = getCacheKey();
    const cacheTimeKey = getCacheTimeKey();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Verificar caché
    if (!forceRefresh && cacheKey && cacheTimeKey) {
      try {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData);
          console.log(` Usando caché | Tenant: ${tenantId}`);
          setData(parsedData);
          setCached(true);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (parseError) {
        console.error('Error parsing cached data:', parseError);
        if (cacheKey) localStorage.removeItem(cacheKey);
        if (cacheTimeKey) localStorage.removeItem(cacheTimeKey);
      }
    }

    setLoading(true);
    setError(null);
    setCached(false);

    abortControllerRef.current = new AbortController();

    try {
      console.log(`📡 Cargando dashboard para usuario ${user.rol} (ID: ${user.id})...`);
      const response = await dashboardService.obtenerDashboardCompleto({
        signal: abortControllerRef.current.signal
      });

      if (response.success && response.data) {
        console.log(` Dashboard cargado: Personal: ${response.data.personal?.total}, Unidades: ${response.data.unidades?.total}`);
        setData(response.data);
        if (cacheKey && cacheTimeKey) {
          localStorage.setItem(cacheKey, JSON.stringify(response.data));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        }
      } else if (response.aborted) {
        console.log(' Petición cancelada');
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log(' Petición cancelada');
        return;
      }
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [user, getCacheKey, getCacheTimeKey]);

  const recargar = useCallback(() => {
    console.log(' Recargando dashboard (force refresh)...');
    return cargarDatos(true);
  }, [cargarDatos]);

  const limpiarCache = useCallback(() => {
    const cacheKey = getCacheKey();
    const cacheTimeKey = getCacheTimeKey();
    if (cacheKey) localStorage.removeItem(cacheKey);
    if (cacheTimeKey) localStorage.removeItem(cacheTimeKey);
    console.log(`🧹 Caché del dashboard limpiada`);
  }, [getCacheKey, getCacheTimeKey]);

  useEffect(() => {
    if (user?.id) {
      cargarDatos(true);
    }
  }, [user?.id, user?.rol, cargarDatos]);

  useEffect(() => {
    if (user?.id) {
      cargarDatos();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
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