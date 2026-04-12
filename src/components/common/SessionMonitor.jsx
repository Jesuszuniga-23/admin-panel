// src/components/common/SessionMonitor.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';

const SessionMonitor = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [sessionActive, setSessionActive] = useState(true);
  const sessionActiveRef = useRef(sessionActive);
  
  //  Ref para debounce/throttle de actividad
  const actividadTimeoutRef = useRef(null);
  const ultimaActividadRef = useRef(Date.now());
  const abortControllerRef = useRef(null);

  // Mantener la referencia actualizada
  useEffect(() => {
    sessionActiveRef.current = sessionActive;
  }, [sessionActive]);

  const verificarSesion = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const estado = await authService.obtenerEstadoSesion({
        signal: abortControllerRef.current.signal
      });
      
      if (!estado.activa) {
        if (sessionActiveRef.current) {
          setSessionActive(false);
          setShowWarning(true);
          //  Calcular countdown en segundos
          const segundosRestantes = (estado.minutos_restantes || 0.5) * 60;
          setCountdown(Math.max(10, Math.floor(segundosRestantes)));
          
          toast.error(estado.motivo || 'Sesión expirada por inactividad', {
            duration: 5000
          });
        }
      } else {
        setSessionActive(true);
        setShowWarning(false);
      }
    } catch (error) {
      //  Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error verificando sesión:', error);
      }
    }
  }, []);

  //  FUNCIÓN CON DEBOUNCE Y THROTTLE - Solo registra actividad cada 30 segundos
  const registrarActividad = useCallback(async () => {
    // Limpiar timeout anterior
    if (actividadTimeoutRef.current) {
      clearTimeout(actividadTimeoutRef.current);
    }
    
    //  Debounce: esperar 2 segundos después del último evento
    actividadTimeoutRef.current = setTimeout(async () => {
      // Verificar si pasó suficiente tiempo desde la última actividad registrada
      const ahora = Date.now();
      const tiempoDesdeUltima = ahora - ultimaActividadRef.current;
      
      //  Solo registrar si pasaron al menos 30 segundos desde la última vez
      if (tiempoDesdeUltima >= 30000) {
        ultimaActividadRef.current = ahora;
        
        //  Cancelar petición anterior si existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        try {
          await authService.registrarActividad({
            signal: abortControllerRef.current.signal
          });
          console.log('🔄 Actividad registrada');
        } catch (error) {
          // Ignorar errores de cancelación y rate limit
          if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
            if (error.response?.status !== 429) {
              console.error('Error registrando actividad:', error);
            }
          }
        }
      }
    }, 2000); // Esperar 2 segundos de inactividad
  }, []);

  // Intervalo para verificar sesión
  useEffect(() => {
    const interval = setInterval(verificarSesion, 30000);
    return () => clearInterval(interval);
  }, [verificarSesion]);

  //  Eventos de actividad del usuario con debounce
  useEffect(() => {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      if (sessionActiveRef.current) {
        registrarActividad();
      }
    };
    
    eventos.forEach(evento => {
      window.addEventListener(evento, handleActivity);
    });
    
    return () => {
      eventos.forEach(evento => {
        window.removeEventListener(evento, handleActivity);
      });
      //  Limpiar timeout al desmontar
      if (actividadTimeoutRef.current) {
        clearTimeout(actividadTimeoutRef.current);
      }
    };
  }, [registrarActividad]);

  //  Limpiar abort controllers al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (actividadTimeoutRef.current) {
        clearTimeout(actividadTimeoutRef.current);
      }
    };
  }, []);

  // Cuenta regresiva del warning
  useEffect(() => {
    let timer;
    if (showWarning && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showWarning && countdown === 0) {
      //  Cerrar sesión y redirigir
      logout();
      navigate('/login');
    }
    
    return () => clearTimeout(timer);
  }, [showWarning, countdown, logout, navigate]);

  const formatTime = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Clock className="text-white" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Sesión expirada</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Tu sesión ha expirado por inactividad.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido automáticamente al inicio de sesión.
            </p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="44" stroke="#E5E7EB" strokeWidth="4" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(countdown / 60) * 276} 276`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-600">{formatTime(countdown)}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogOut size={18} />
            Iniciar sesión nuevamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionMonitor;