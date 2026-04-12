// src/components/common/RateLimitBanner.jsx
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Clock, X, Shield } from 'lucide-react';
import { useRateLimit } from '../../hooks/useRateLimit';

const RateLimitBanner = ({ onDismiss, autoHide = true, autoHideDelay = 5000 }) => {
  const { isLimited, timeFormatted, timeRemaining, message, esAdmin } = useRateLimit();
  const [dismissed, setDismissed] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  //  Resetear dismissed cuando se activa un nuevo rate limit
  useEffect(() => {
    if (isLimited) {
      setDismissed(false);
    }
  }, [isLimited]);

  // Auto-hide después de cierto tiempo 
  useEffect(() => {
    if (autoHide && isLimited && !dismissed) {
      if (autoHideTimer) clearTimeout(autoHideTimer);
      
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDelay);
      
      setAutoHideTimer(timer);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, isLimited, dismissed, autoHideDelay]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [autoHideTimer]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  }, [onDismiss, autoHideTimer]);

  if (!isLimited || dismissed) return null;

  // Formatear tiempo de forma segura
  const displayTime = timeFormatted || 
    (timeRemaining ? `${Math.ceil(timeRemaining)} segundos` : 'un momento');

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md animate-slideDown">
      <div className={`rounded-lg shadow-xl p-4 mx-4 border-l-4 ${
        esAdmin 
          ? 'bg-blue-50 border-blue-500' 
          : 'bg-amber-50 border-amber-500'
      }`}>
        <div className="flex items-start gap-3">
          {esAdmin ? (
            <Shield className="text-blue-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          )}
          
          <div className="flex-1">
            <h4 className={`font-semibold text-sm ${
              esAdmin ? 'text-blue-800' : 'text-amber-800'
            }`}>
              {esAdmin ? 'Límite temporal' : 'Sistema limitado'}
            </h4>
            
            <p className={`text-xs mt-1 ${
              esAdmin ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {message || 'Demasiadas peticiones. Por favor espera un momento.'}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} className={esAdmin ? 'text-blue-600' : 'text-amber-600'} />
              <span className={`text-xs font-medium ${
                esAdmin ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {esAdmin ? 'Espera' : 'Tiempo de espera'}: {displayTime}
              </span>
            </div>

            {esAdmin && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Shield size={12} />
                Reintentando automáticamente...
              </p>
            )}

            {/* Mostrar consejo para usuarios normales */}
            {!esAdmin && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                Si el problema persiste, contacta al administrador.
              </p>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className={esAdmin ? 'text-blue-400 hover:text-blue-600' : 'text-amber-400 hover:text-amber-600'}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitBanner;