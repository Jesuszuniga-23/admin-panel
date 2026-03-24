// src/hooks/useSession.js
import { useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

export const useSession = () => {
  const [sessionState, setSessionState] = useState({
    activa: true,
    minutos_restantes: null,
    minutos_sin_actividad: 0
  });
  const [loading, setLoading] = useState(true);

  const verificarSesion = useCallback(async () => {
    try {
      const estado = await authService.obtenerEstadoSesion();
      setSessionState(estado);
      return estado;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return { activa: false, motivo: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarActividad = useCallback(async () => {
    try {
      await authService.registrarActividad();
    } catch (error) {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    verificarSesion();
    
    const interval = setInterval(verificarSesion, 30000);
    return () => clearInterval(interval);
  }, [verificarSesion]);

  return {
    sessionState,
    loading,
    verificarSesion,
    registrarActividad
  };
};