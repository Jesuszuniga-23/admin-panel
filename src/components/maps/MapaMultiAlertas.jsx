// src/components/maps/MapaMultiAlertas.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Heart } from 'lucide-react';
import { renderToString } from 'react-dom/server';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Iconos personalizados por tipo
const createCustomIcon = (tipo) => {
  const color = tipo === 'panico' ? '#ef4444' : '#10b981';
  const IconComponent = tipo === 'panico' ? AlertTriangle : Heart;
  
  const iconHtml = renderToString(
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
         style={{ backgroundColor: color }}>
      <IconComponent size={16} className="text-white" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const MapaMultiAlertas = ({ alertas = [], onSeleccionarAlerta }) => {
  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadoresRef = useRef([]);
  const grupoMarcadoresRef = useRef(null);

  useEffect(() => {
    if (!mapaRef.current || alertas.length === 0) return;

    // Limpiar instancia anterior
    if (mapaInstancia.current) {
      mapaInstancia.current.remove();
      mapaInstancia.current = null;
    }

    try {
      // Calcular centro del mapa (promedio de todas las coordenadas)
      const latMedia = alertas.reduce((sum, a) => sum + (a.lat || 0), 0) / alertas.length;
      const lngMedia = alertas.reduce((sum, a) => sum + (a.lng || 0), 0) / alertas.length;

      // Crear mapa
      const mapa = L.map(mapaRef.current).setView([latMedia, lngMedia], 12);
      mapaInstancia.current = mapa;

      // Capa base
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);

      // Grupo de marcadores para mejor manejo
      const grupo = L.layerGroup().addTo(mapa);
      grupoMarcadoresRef.current = grupo;

      // Agregar marcadores
      alertas.forEach(alerta => {
        if (!alerta.lat || !alerta.lng) return;

        const icono = createCustomIcon(alerta.tipo);
        const marcador = L.marker([alerta.lat, alerta.lng], { icon: icono }).addTo(grupo);

        // Popup personalizado
        const popupContent = renderToString(
          <div className="p-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'}`}>
                {alerta.tipo === 'panico' 
                  ? <AlertTriangle size={14} className="text-red-600" />
                  : <Heart size={14} className="text-green-600" />
                }
              </div>
              <span className="font-semibold text-gray-800">Alerta #{alerta.id}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {alerta.ciudadano?.nombre || 'Ciudadano desconocido'}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1">
                <span className="font-medium">Estado:</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  alerta.estado === 'activa' ? 'bg-blue-100 text-blue-700' :
                  alerta.estado === 'cerrada' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {alerta.estado}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Tipo:</span>
                <span>{alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}</span>
              </div>
            </div>
          </div>
        );

        marcador.bindPopup(popupContent);

        // Evento de clic
        marcador.on('click', () => {
          if (onSeleccionarAlerta) {
            onSeleccionarAlerta(alerta);
          }
        });

        marcadoresRef.current.push(marcador);
      });

    } catch (error) {
      console.error('Error inicializando mapa múltiple:', error);
    }

    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
      }
      marcadoresRef.current = [];
    };
  }, [alertas, onSeleccionarAlerta]);

  if (alertas.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-gray-400">No hay ubicaciones para mostrar</p>
      </div>
    );
  }

  return <div ref={mapaRef} className="w-full h-full" />;
};

export default MapaMultiAlertas;