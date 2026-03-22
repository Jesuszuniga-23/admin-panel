import { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import MapaOSM from '../maps/MapaOSM';

const BotonUbicacion = ({ lat, lng, titulo, alertaId, altura = '280px' }) => {
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [cargandoDireccion, setCargandoDireccion] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');

  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 border border-gray-200">
        <MapPin size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Coordenadas no disponibles</p>
      </div>
    );
  }

  const handleVerUbicacion = async () => {
    setMostrarMapa(true);
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

  return (
    <div className="space-y-3">
      {!mostrarMapa ? (
        <button
          onClick={handleVerUbicacion}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
        >
          <MapPin size={16} className="text-white" />
          <span>Ver ubicación</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* Dirección */}
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
                <span className="font-semibold text-blue-800 flex items-center gap-1">
                  <MapPin size={14} className="text-blue-600" /> Dirección:
                </span>
                <p className="mt-1">{direccion}</p>
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