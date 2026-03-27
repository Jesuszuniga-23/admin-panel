// src/components/maps/MapaConDireccion.jsx
import { useState, useEffect, useRef } from 'react';
import MapaOSM from './MapaOSM';
import { MapPin, Loader, X, AlertCircle } from 'lucide-react';

const MapaConDireccion = ({
  lat,
  lng,
  titulo,
  alertaId,
  altura = '320px',
  mostrarDireccion = true,
  mostrarMapa = true
}) => {
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  // Validar coordenadas
  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 border border-gray-200">
        <MapPin size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Coordenadas no disponibles</p>
        <p className="text-xs text-gray-400 mt-1">ID: #{alertaId}</p>
      </div>
    );
  }

  // ✅ Obtener dirección automáticamente al montar el componente con AbortController
  useEffect(() => {
    const obtenerDireccion = async () => {
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
        
        // ✅ Limpiar dirección si no hay datos
        if (data && data.display_name) {
          setDireccion(data.display_name);
        } else {
          setDireccion('Dirección no disponible');
        }
      } catch (err) {
        // ✅ Ignorar errores de cancelación
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          console.error('Error obteniendo dirección:', err);
          setError('No se pudo obtener la dirección');
        }
      } finally {
        setCargandoDireccion(false);
        abortControllerRef.current = null;
      }
    };

    obtenerDireccion();
    
    // ✅ Limpiar al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [lat, lng]);

  // ✅ Función para reintentar obtener dirección
  const handleReintentar = () => {
    setError('');
    setDireccion('');
    
    // Disparar efecto nuevamente
    const obtenerDireccion = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setCargandoDireccion(true);
      
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

        if (!response.ok) throw new Error('Error al obtener dirección');

        const data = await response.json();
        setDireccion(data.display_name || 'Dirección no disponible');
      } catch (err) {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          setError('No se pudo obtener la dirección');
        }
      } finally {
        setCargandoDireccion(false);
        abortControllerRef.current = null;
      }
    };
    
    obtenerDireccion();
  };

  return (
    <div className="space-y-3">
      {/* Dirección (si está disponible y se debe mostrar) */}
      {mostrarDireccion && (
        <>
          {cargandoDireccion ? (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center gap-2">
              <Loader size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">Obteniendo dirección...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={handleReintentar}
                className="text-xs text-red-600 hover:text-red-800 font-medium underline"
              >
                Reintentar
              </button>
            </div>
          ) : direccion ? (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-blue-800 flex items-center gap-1">
                  <MapPin size={14} className="text-blue-600" /> Dirección:
                </span>
                <p className="mt-1 text-gray-700 break-words">{direccion}</p>
                <p className="text-xs text-gray-400 mt-1">Coordenadas: {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Mapa */}
      {mostrarMapa && (
        <MapaOSM
          lat={lat}
          lng={lng}
          titulo={titulo}
          subtitulo={`ID: #${alertaId}`}
          altura={altura}
        />
      )}
    </div>
  );
};

export default MapaConDireccion;