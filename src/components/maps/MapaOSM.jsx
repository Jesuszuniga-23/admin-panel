// src/components/maps/MapaOSM.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server'; // 👈 IMPORTAR ESTO

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
    if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)) || !mapaRef.current) {
      return;
    }

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
      
      // 🔥 CONVERTIR JSX A HTML STRING
      let tituloHTML = '';
      if (typeof titulo === 'string') {
        tituloHTML = titulo;
      } else if (titulo) {
        tituloHTML = renderToString(titulo);
      } else {
        tituloHTML = 'Ubicación';
      }

      marcador.bindPopup(`
        <div style="text-align: center; padding: 8px; min-width: 150px;">
          ${tituloHTML}
          ${subtitulo ? `<div style="margin-top: 4px; font-size: 11px; color: #666;">${subtitulo}</div>` : ''}
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