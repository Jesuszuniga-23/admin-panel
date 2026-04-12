import React, { useEffect, useState } from 'react';
import { getIconConfig, getColorByTipoAlerta } from '../../constants/iconos';
import MapaConDireccion from '../maps/MapaConDireccion';
import { X, Maximize2, Minimize2 } from 'lucide-react';

const IconoEntidad = ({ 
  entidad,
  size = 16,
  className = '',
  color = null
}) => {
  const config = getIconConfig(entidad);
  const IconComponent = config?.icono;
  
  if (!IconComponent) {
    console.warn(`Icono no encontrado para entidad: ${entidad}`);
    return null;
  }
  
  const colorClass = color || config?.textLight || 'text-gray-600';
  
  return (
    <IconComponent 
      size={size} 
      className={`${colorClass} ${className}`}
    />
  );
};

export const BadgeIcono = ({ entidad, texto, size = 14, className = '' }) => {
  const config = getIconConfig(entidad);
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config?.bgLight || 'bg-gray-100'} ${config?.textLight || 'text-gray-600'} ${className}`}>
      <IconoEntidad entidad={entidad} size={size} />
      <span>{texto || config?.label}</span>
    </span>
  );
};

export const BadgeTipoAlerta = ({ tipo, size = 14 }) => {
  const config = getColorByTipoAlerta(tipo);
  const texto = tipo === 'panico' ? 'Pánico' : 'Médica';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${config.bgLight} ${config.textLight}`}>
      <IconoEntidad entidad={tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} size={size} />
      <span>{texto}</span>
    </span>
  );
};

export const BotonMapa = ({ onClick, size = 16, texto = 'Ver mapa', className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-xs font-medium ${className}`}
    >
      <IconoEntidad entidad="MAPA" size={size} color="text-blue-600" />
      <span>{texto}</span>
    </button>
  );
};

// =====================================================
// MODAL DEL MAPA CORREGIDO
// =====================================================
export const ModalMapa = ({ isOpen, onClose, lat, lng, titulo, alertaId, tipo }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Forzar re-render del mapa cuando cambia el estado del modal
  useEffect(() => {
    if (isOpen) {
      // Pequeño retraso para asegurar que el DOM esté listo
      setTimeout(() => setMapKey(prev => prev + 1), 100);
    }
  }, [isOpen, isFullscreen]);

  // Manejar tecla ESC para cerrar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const config = tipo === 'panico' ? getColorByTipoAlerta('panico') : getColorByTipoAlerta('medica');
  
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    // z-index aumentado a 9999 (mayor que el sidebar que tiene 80)
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal responsivo con tamaño máximo */}
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl overflow-hidden
          transition-all duration-300 ease-in-out
          ${isFullscreen 
            ? 'fixed inset-4 w-auto h-auto rounded-2xl' 
            : 'w-full max-w-4xl max-h-[90vh]'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${config.bgGradient} px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl">
              <IconoEntidad 
                entidad={tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} 
                size={18} 
                color="text-white" 
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{titulo || 'Ubicación del Incidente'}</h3>
              {alertaId && (
                <p className="text-[10px] sm:text-xs text-white/80">ID: #{alertaId}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Botón de pantalla completa */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? "Salir pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize2 size={18} className="sm:w-5 sm:h-5 text-white" />
              ) : (
                <Maximize2 size={18} className="sm:w-5 sm:h-5 text-white" />
              )}
            </button>
            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X size={18} className="sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Contenido - Mapa con altura responsiva */}
        <div className={`p-3 sm:p-4 ${isFullscreen ? 'h-[calc(100%-80px)]' : ''}`}>
          <div className={`w-full ${isFullscreen ? 'h-full' : 'h-[250px] sm:h-[350px] md:h-[450px]'}`}>
            <MapaConDireccion
              key={mapKey}
              lat={lat}
              lng={lng}
              titulo={titulo}
              alertaId={alertaId}
              altura="100%"
            />
          </div>
          
          {/* Información de coordenadas */}
          {lat && lng && (
            <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] sm:text-xs text-gray-500 text-center">
                 Coordenadas: {typeof lat === 'number' ? lat.toFixed(6) : lat}°, {typeof lng === 'number' ? lng.toFixed(6) : lng}°
              </p>
            </div>
          )}
        </div>
        
        {/* Footer con botón cerrar */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <p className="text-[10px] sm:text-xs text-gray-400">
             Haz zoom con el mouse • Presiona ESC para cerrar
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 sm:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <X size={14} />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconoEntidad;