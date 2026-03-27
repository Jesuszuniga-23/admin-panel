// src/hooks/useDashboardCache.js
import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/admin/dashboard.service';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const CACHE_KEY = 'dashboard_cache';
const CACHE_TIME_KEY = 'dashboard_cache_time';

export const useDashboardCache = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);

  const cargarDatos = useCallback(async (forceRefresh = false) => {
    // Verificar caché si no se fuerza recarga
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      
      if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
        setData(JSON.parse(cachedData));
        setCached(true);
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setCached(false);
    
    const abortController = new AbortController();
    
    try {
      const response = await dashboardService.obtenerDashboardCompleto({
        signal: abortController.signal
      });
      
      if (response.success && response.data) {
        setData(response.data);
        // Guardar en caché
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      } else if (response.aborted) {
        console.log('Petición cancelada');
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
    
    return () => abortController.abort();
  }, []);

  const recargar = useCallback(() => {
    return cargarDatos(true);
  }, [cargarDatos]);

  // Cargar datos al montar
  useEffect(() => {
    const abortController = new AbortController();
    cargarDatos();
    return () => abortController.abort();
  }, [cargarDatos]);

  return {
    data,
    loading,
    error,
    cached,
    recargar
  };
};