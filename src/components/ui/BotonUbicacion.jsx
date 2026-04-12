// src/components/ui/BotonUbicacion.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { MapPin, Loader, X, AlertCircle } from 'lucide-react';
import MapaOSM from '../maps/MapaOSM';

const BotonUbicacion = ({ 
  lat, 
  lng, 
  titulo, 
  alertaId, 
  altura = '280px',
  mostrarMapaPorDefecto = false,
  onMapClose
}) => {
  const [mostrarMapa, setMostrarMapa] = useState(mostrarMapaPorDefecto);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  //  Validar coordenadas
  const coordenadasValidas = lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  
  // Limpiar estado cuando cambian las coordenadas
  useEffect(() => {
    if (!coordenadasValidas) return;
    
    setDireccion('');
    setError('');
    setMostrarMapa(mostrarMapaPorDefecto);
  }, [lat, lng, coordenadasValidas, mostrarMapaPorDefecto]);

  // Función para obtener dirección con AbortController
  const obtenerDireccion = useCallback(async () => {
    if (!coordenadasValidas) return;
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setCargandoDireccion(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'SistemaEmergencias/1.0'
          },
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDireccion(data.display_name || 'Dirección no disponible');
    } catch (err) {
      //  Ignorar errores de cancelación
      if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
        console.error('Error obteniendo dirección:', err);
        setError('No se pudo obtener la dirección');
      }
    } finally {
      setCargandoDireccion(false);
      abortControllerRef.current = null;
    }
  }, [lat, lng, coordenadasValidas]);

  //  Manejar clic en botón
  const handleVerUbicacion = useCallback(async () => {
    setMostrarMapa(true);
    await obtenerDireccion();
  }, [obtenerDireccion]);

  // Cerrar mapa
  const handleCerrarMapa = useCallback(() => {
    setMostrarMapa(false);
    if (onMapClose) {
      onMapClose();
    }
  }, [onMapClose]);

  //  Reintentar obtener dirección
  const handleReintentar = useCallback(() => {
    obtenerDireccion();
  }, [obtenerDireccion]);

  //  Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  //  Si las coordenadas no son válidas
  if (!coordenadasValidas) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 border border-gray-200">
        <MapPin size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Coordenadas no disponibles</p>
        {alertaId && <p className="text-xs text-gray-400 mt-1">ID: #{alertaId}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!mostrarMapa ? (
        <button
          onClick={handleVerUbicacion}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
          aria-label="Ver ubicación en mapa"
        >
          <MapPin size={16} className="text-white" />
          <span>Ver ubicación</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* Cabecera del mapa con botón de cierre */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Ubicación</span>
            </div>
            <button
              onClick={handleCerrarMapa}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar mapa"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Dirección */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            {cargandoDireccion ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader size={16} className="animate-spin" />
                <span className="text-sm">Obteniendo dirección...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
                <button
                  onClick={handleReintentar}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            ) : direccion ? (
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-blue-800 flex items-center gap-1">
                  <MapPin size={14} className="text-blue-600" /> Dirección:
                </span>
                <p className="mt-1 break-words">{direccion}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Coordenadas: {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Mapa */}
          <MapaOSM
            lat={lat}
            lng={lng}
            titulo={titulo}
            subtitulo={`ID: #${alertaId}`}
            altura={altura}
          />
        </div>
      )}
    </div>
  );
};

export default BotonUbicacion;