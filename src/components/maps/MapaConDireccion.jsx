import { useState } from 'react';
import MapaOSM from './MapaOSM';
import { MapPin, Loader, X } from 'lucide-react';

const MapaConDireccion = ({
  lat,
  lng,
  titulo,
  alertaId,
  altura = '320px'
}) => {
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [mapaVisible, setMapaVisible] = useState(true); // Siempre visible al montar el componente

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

  // Obtener dirección automáticamente al montar el componente
  useState(() => {
    const obtenerDireccion = async () => {
      setCargandoDireccion(true);
      try {
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

    obtenerDireccion();
  }, [lat, lng]);

  return (
    <div className="space-y-3">
      {/* Dirección (si está disponible) */}
      {cargandoDireccion ? (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center gap-2">
          <Loader size={16} className="animate-spin text-blue-600" />
          <span className="text-sm text-blue-600">Obteniendo dirección...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : direccion ? (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-blue-800 flex items-center gap-1">
              <MapPin size={14} className="text-blue-600" /> Dirección:
            </span>
            <p className="mt-1">{direccion}</p>
          </div>
        </div>
      ) : null}

      {/* Mapa - DIRECTAMENTE VISIBLE */}
      <MapaOSM
        lat={lat}
        lng={lng}
        titulo={titulo}
        subtitulo={`ID: #${alertaId}`}
        altura={altura}
      />
    </div>
  );
};

export default MapaConDireccion;