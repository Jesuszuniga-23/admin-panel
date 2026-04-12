// src/hooks/useSession.js
import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/auth.service';

export const useSession = (options = {}) => {
  const { 
    checkInterval = 30000,      // Intervalo de verificación (30s)
    activityThrottle = 30000,   // Throttle para actividad (30s)
    activityDebounce = 2000     // Debounce para actividad (2s)
  } = options;
  
  const [sessionState, setSessionState] = useState({
    activa: true,
    minutos_restantes: null,
    minutos_sin_actividad: 0
  });
  const [loading, setLoading] = useState(true);
  
  //  Refs para AbortControllers y timeouts
  const verificarAbortControllerRef = useRef(null);
  const actividadAbortControllerRef = useRef(null);
  const actividadTimeoutRef = useRef(null);
  const ultimaActividadRef = useRef(Date.now());

  //  Función para cancelar todas las peticiones
  const cancelarPeticiones = useCallback(() => {
    if (verificarAbortControllerRef.current) {
      verificarAbortControllerRef.current.abort();
      verificarAbortControllerRef.current = null;
    }
    if (actividadAbortControllerRef.current) {
      actividadAbortControllerRef.current.abort();
      actividadAbortControllerRef.current = null;
    }
    if (actividadTimeoutRef.current) {
      clearTimeout(actividadTimeoutRef.current);
      actividadTimeoutRef.current = null;
    }
  }, []);

  //  Verificar sesión con AbortController
  const verificarSesion = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (verificarAbortControllerRef.current) {
      verificarAbortControllerRef.current.abort();
      console.log(' Verificación de sesión anterior cancelada');
    }
    
    verificarAbortControllerRef.current = new AbortController();
    
    try {
      const estado = await authService.obtenerEstadoSesion({
        signal: verificarAbortControllerRef.current.signal
      });
      setSessionState(estado);
      return estado;
    } catch (error) {
      //  Ignorar errores de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(' Verificación de sesión cancelada');
        return null;
      }
      console.error('Error verificando sesión:', error);
      return { activa: false, motivo: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, []);

  //  Registrar actividad con debounce y throttle
  const registrarActividad = useCallback(async () => {
    // Limpiar timeout anterior
    if (actividadTimeoutRef.current) {
      clearTimeout(actividadTimeoutRef.current);
    }
    
    //  Debounce: esperar activityDebounce ms después del último evento
    actividadTimeoutRef.current = setTimeout(async () => {
      // Verificar si pasó suficiente tiempo desde la última actividad registrada
      const ahora = Date.now();
      const tiempoDesdeUltima = ahora - ultimaActividadRef.current;
      
      //  Throttle: solo registrar si pasaron activityThrottle ms
      if (tiempoDesdeUltima >= activityThrottle) {
        ultimaActividadRef.current = ahora;
        
        // Cancelar petición anterior si existe
        if (actividadAbortControllerRef.current) {
          actividadAbortControllerRef.current.abort();
        }
        
        actividadAbortControllerRef.current = new AbortController();
        
        try {
          await authService.registrarActividad({
            signal: actividadAbortControllerRef.current.signal
          });
          console.log('Actividad registrada');
        } catch (error) {
          //  Ignorar errores de cancelación y rate limit
          if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
            if (error.response?.status !== 429) {
              console.error('Error registrando actividad:', error);
            }
          }
        } finally {
          actividadAbortControllerRef.current = null;
        }
      }
    }, activityDebounce);
  }, [activityThrottle, activityDebounce]);

  //  Intervalo para verificar sesión
  useEffect(() => {
    verificarSesion();
    
    const interval = setInterval(() => {
      verificarSesion();
    }, checkInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [verificarSesion, checkInterval]);

  //  Limpiar al desmontar
  useEffect(() => {
    return () => {
      cancelarPeticiones();
    };
  }, [cancelarPeticiones]);

  //  Función para forzar verificación inmediata
  const refresh = useCallback(() => {
    setLoading(true);
    return verificarSesion();
  }, [verificarSesion]);

  //  Función para obtener tiempo restante formateado
  const getTiempoRestanteFormateado = useCallback(() => {
    const { minutos_restantes } = sessionState;
    if (!minutos_restantes) return null;
    
    const horas = Math.floor(minutos_restantes / 60);
    const minutos = minutos_restantes % 60;
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}min`;
  }, [sessionState]);

  //  Indicador de sesión próxima a expirar (menos de 5 minutos)
  const isExpiringSoon = useCallback(() => {
    const { minutos_restantes } = sessionState;
    return minutos_restantes !== null && minutos_restantes <= 5 && minutos_restantes > 0;
  }, [sessionState]);

  return {
    sessionState,
    loading,
    verificarSesion,
    registrarActividad,
    refresh,
    getTiempoRestanteFormateado,
    isExpiringSoon,
    cancelarPeticiones
  };
};

//  Versión con monitoreo de inactividad automático
export const useSessionWithInactivity = (options = {}) => {
  const { 
    inactivityTimeout = 15 * 60 * 1000, // 15 minutos
    onInactivityWarning,
    onInactivityLogout
  } = options;
  
  const session = useSession(options);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [inactivityCounter, setInactivityCounter] = useState(0);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  //  Resetear timers de inactividad
  const resetInactivityTimers = useCallback(() => {
    setInactivityCounter(0);
    setInactivityWarning(false);
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Programar warning (1 minuto antes de logout)
    warningTimerRef.current = setTimeout(() => {
      setInactivityWarning(true);
      if (onInactivityWarning) {
        onInactivityWarning();
      }
    }, inactivityTimeout - 60000);
    
    // Programar logout
    inactivityTimerRef.current = setTimeout(() => {
      if (onInactivityLogout) {
        onInactivityLogout();
      }
    }, inactivityTimeout);
  }, [inactivityTimeout, onInactivityWarning, onInactivityLogout]);

  //  Escuchar actividad del usuario
  useEffect(() => {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimers();
      session.registrarActividad();
    };
    
    eventos.forEach(evento => {
      window.addEventListener(evento, handleActivity);
    });
    
    resetInactivityTimers();
    
    return () => {
      eventos.forEach(evento => {
        window.removeEventListener(evento, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [resetInactivityTimers, session]);

  return {
    ...session,
    inactivityWarning,
    inactivityCounter,
    resetInactivityTimers
  };
};

//  Versión con conteo regresivo visual
export const useSessionCountdown = () => {
  const session = useSession();
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    if (!session.sessionState.activa || !session.sessionState.minutos_restantes) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
      return;
    }
    
    // Inicializar countdown en segundos
    let segundosRestantes = session.sessionState.minutos_restantes * 60;
    setCountdown(segundosRestantes);
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      segundosRestantes--;
      setCountdown(segundosRestantes);
      
      if (segundosRestantes <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      }
    }, 1000);
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [session.sessionState.activa, session.sessionState.minutos_restantes]);

  const formatCountdown = useCallback(() => {
    if (!countdown || countdown <= 0) return '00:00';
    
    const minutos = Math.floor(countdown / 60);
    const segundos = countdown % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }, [countdown]);

  return {
    ...session,
    countdown,
    countdownFormatted: formatCountdown(),
    isExpiring: countdown !== null && countdown <= 60 // menos de 1 minuto
  };
};