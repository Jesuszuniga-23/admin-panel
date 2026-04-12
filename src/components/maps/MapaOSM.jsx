// src/components/maps/MapaOSM.jsx
import { useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapaOSM = ({ 
  lat, 
  lng, 
  titulo, 
  subtitulo, 
  altura = '320px', 
  zoom = 16,
  minHeight = '200px',
  showPopup = true,
  onMapClick
}) => {
  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadorRef = useRef(null);
  const resizeObserverRef = useRef(null);

  //  Validar coordenadas
  const coordenadasValidas = useMemo(() => {
    if (!lat || !lng) return false;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    return !isNaN(latNum) && !isNaN(lngNum) && 
           latNum >= -90 && latNum <= 90 && 
           lngNum >= -180 && lngNum <= 180;
  }, [lat, lng]);

  //  Memoizar contenido del popup
  const popupContent = useMemo(() => {
    if (!showPopup) return null;
    
    let tituloHTML = '';
    if (typeof titulo === 'string') {
      tituloHTML = titulo;
    } else if (titulo) {
      try {
        tituloHTML = renderToString(titulo);
      } catch (e) {
        console.error('Error rendering titulo:', e);
        tituloHTML = 'Ubicación';
      }
    } else {
      tituloHTML = 'Ubicación';
    }

    return `
      <div style="text-align: center; padding: 8px; min-width: 150px;">
        ${tituloHTML}
        ${subtitulo ? `<div style="margin-top: 4px; font-size: 11px; color: #666;">${subtitulo}</div>` : ''}
      </div>
    `;
  }, [titulo, subtitulo, showPopup]);

  //  Función para actualizar marcador
  const actualizarMarcador = useCallback((mapa, posicion) => {
    if (marcadorRef.current) {
      mapa.removeLayer(marcadorRef.current);
      marcadorRef.current = null;
    }
    
    const marcador = L.marker(posicion).addTo(mapa);
    marcadorRef.current = marcador;
    
    if (showPopup && popupContent) {
      marcador.bindPopup(popupContent).openPopup();
    }
    
    return marcador;
  }, [showPopup, popupContent]);

  //  Función para manejar cambio de tamaño
  const handleResize = useCallback(() => {
    if (mapaInstancia.current) {
      setTimeout(() => {
        mapaInstancia.current.invalidateSize();
      }, 100);
    }
  }, []);

  // Inicializar y actualizar mapa
  useEffect(() => {
    if (!coordenadasValidas || !mapaRef.current) {
      return;
    }

    const posicion = [parseFloat(lat), parseFloat(lng)];
    
    // Si el mapa ya existe, solo actualizar vista y marcador
    if (mapaInstancia.current) {
      mapaInstancia.current.setView(posicion, zoom);
      actualizarMarcador(mapaInstancia.current, posicion);
      return;
    }

    // Crear nuevo mapa
    try {
      const mapa = L.map(mapaRef.current).setView(posicion, zoom);
      mapaInstancia.current = mapa;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);

      actualizarMarcador(mapa, posicion);
      
      //  Evento de clic en el mapa
      if (onMapClick) {
        mapa.on('click', (e) => {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }

    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
        marcadorRef.current = null;
      }
    };
  }, [coordenadasValidas, lat, lng, zoom, actualizarMarcador, onMapClick]);

  // Manejar cambio de tamaño de ventana
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    
    //  Usar ResizeObserver para detectar cambios en el contenedor
    if (mapaRef.current && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(mapaRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [handleResize]);

  //  Mensaje cuando las coordenadas no son válidas
  if (!coordenadasValidas) {
    return (
      <div 
        style={{ 
          height: altura, 
          minHeight: minHeight,
          width: '100%', 
          borderRadius: '12px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="bg-gray-100 rounded-xl"
      >
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Coordenadas no disponibles</p>
          <p className="text-xs mt-1">Lat: {lat || '?'}, Lng: {lng || '?'}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapaRef} 
      style={{ 
        height: altura, 
        minHeight: minHeight,
        width: '100%', 
        borderRadius: '12px',
        backgroundColor: '#e5e7eb'
      }} 
      className="overflow-hidden"
    />
  );
};

export default MapaOSM;