// src/components/maps/MapaConDireccion.jsx
import { useState } from 'react';
import MapaOSM from './MapaOSM';
import { MapPin, Loader } from 'lucide-react';

const MapaConDireccion = ({
  lat,
  lng,
  titulo,
  alertaId,
  altura = '320px'
}) => {
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');

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

  const handleVerUbicacion = async () => {
    setMostrarMapa(true);
    setCargandoDireccion(true);

    try {
      // SOLO UNA PETICIÓN - cuando el usuario hace clic
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
        {
          headers: {
            'User-Agent': 'SistemaEmergencias/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Error al obtener dirección');

      const data = await response.json();
      setDireccion(data.display_name || 'Dirección no disponible');

    } catch (err) {
      console.error('Error obteniendo dirección:', err);
      setError('No se pudo obtener la dirección');
    } finally {
      setCargandoDireccion(false);
    }
  };

  return (
    <div className="space-y-2">
      {!mostrarMapa ? (
        /* Botón para mostrar el mapa - SOLO UNA VEZ POR ALERTA */
        <button
          onClick={handleVerUbicacion}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl text-blue-700 font-medium transition-all group"
        >
          <MapPin size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
          <span>Ver ubicación en mapa</span>
        </button>
      ) : (
        /* Mapa con la dirección */
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            {cargandoDireccion ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader size={16} className="animate-spin" />
                <span className="text-sm">Obteniendo dirección...</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : direccion ? (
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-blue-800">📍 Dirección:</span>
                <p className="mt-1">{direccion}</p>
              </div>
            ) : null}
          </div>

          {/* ✅ CORREGIDO: Ahora usa MapaOSM, no a sí mismo */}
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

export default MapaConDireccion;