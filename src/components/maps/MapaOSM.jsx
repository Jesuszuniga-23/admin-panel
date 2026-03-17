// src/components/maps/MapaOSM.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapaOSM = ({ lat, lng, titulo, subtitulo, altura = '320px', zoom = 16 }) => {
  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);

  useEffect(() => {
    // Validar coordenadas
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)) || !mapaRef.current) {
      return;
    }

    // Limpiar instancia anterior
    if (mapaInstancia.current) {
      mapaInstancia.current.remove();
      mapaInstancia.current = null;
    }

    try {
      const posicion = [parseFloat(lat), parseFloat(lng)];
      const mapa = L.map(mapaRef.current).setView(posicion, zoom);
      mapaInstancia.current = mapa;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);

      const marcador = L.marker(posicion).addTo(mapa);
      marcador.bindPopup(`
        <div style="text-align: center;">
          <strong>${titulo}</strong>
          ${subtitulo ? `<br/><small>${subtitulo}</small>` : ''}
        </div>
      `).openPopup();

    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }

    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
      }
    };
  }, [lat, lng, zoom, titulo, subtitulo]);

  return <div ref={mapaRef} style={{ height: altura, width: '100%', borderRadius: '12px' }} />;
};

export default MapaOSM;