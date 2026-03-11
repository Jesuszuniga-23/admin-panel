import { useState, useEffect } from 'react';
import { AlertCircle, Clock, X, Shield } from 'lucide-react';
import { useRateLimit } from '../../hooks/useRateLimit';

const RateLimitBanner = () => {
  const { isLimited, timeFormatted, message, esAdmin } = useRateLimit();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isLimited) setDismissed(false);
  }, [isLimited]);

  if (!isLimited || dismissed) return null;

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
              {esAdmin ? '⚡ Límite temporal' : '⏳ Sistema limitado'}
            </h4>
            
            <p className={`text-xs mt-1 ${
              esAdmin ? 'text-blue-700' : 'text-amber-700'
            }`}>
              {message || 'Demasiadas peticiones'}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} className={esAdmin ? 'text-blue-600' : 'text-amber-600'} />
              <span className={`text-xs font-medium ${
                esAdmin ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {esAdmin ? 'Espera' : 'Tiempo de espera'}: {timeFormatted}
              </span>
            </div>

            {esAdmin && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Shield size={12} />
                Reintentando automáticamente...
              </p>
            )}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className={esAdmin ? 'text-blue-400 hover:text-blue-600' : 'text-amber-400 hover:text-amber-600'}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitBanner;