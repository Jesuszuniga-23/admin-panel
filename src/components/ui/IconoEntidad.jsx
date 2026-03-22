import React from 'react';
import { getIconConfig, getColorByTipoAlerta } from '../../constants/iconos';
import MapaConDireccion from '../maps/MapaConDireccion';
import { X } from 'lucide-react';

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
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-xs font-medium shadow-md hover:shadow-lg ${className}`}
    >
      <IconoEntidad entidad="MAPA" size={size} color="text-white" />
      <span>{texto}</span>
    </button>
  );
};

export const ModalMapa = ({ isOpen, onClose, lat, lng, titulo, alertaId, tipo }) => {
  if (!isOpen) return null;
  
  const config = tipo === 'panico' ? getColorByTipoAlerta('panico') : getColorByTipoAlerta('medica');
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente FUERTE */}
        <div className={`bg-gradient-to-r ${config.bgGradient} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <IconoEntidad 
                entidad={tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} 
                size={20} 
                color="text-white" 
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{titulo}</h3>
              <p className="text-sm text-white/80">ID: #{alertaId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
        
        {/* Contenido - Mapa */}
        <div className="p-4">
          <MapaConDireccion
            lat={lat}
            lng={lng}
            titulo={titulo}
            alertaId={alertaId}
            altura="450px"
          />
        </div>
        
        {/* Footer con botón cerrar */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <X size={16} />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IconoEntidad;