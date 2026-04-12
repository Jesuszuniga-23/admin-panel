// src/components/maps/MapaMultiAlertas.jsx
// VERSIÓN CORREGIDA - Con geocerca del municipio

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Heart, Loader } from 'lucide-react';
import { renderToString } from 'react-dom/server';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const iconosCache = new Map();

const getCustomIcon = (tipo) => {
  if (iconosCache.has(tipo)) return iconosCache.get(tipo);

  const color = tipo === 'panico' ? '#ef4444' : '#10b981';
  const IconComponent = tipo === 'panico' ? AlertTriangle : Heart;

  const iconHtml = renderToString(
    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style={{ backgroundColor: color }}>
      <IconComponent size={16} className="text-white" />
    </div>
  );

  const icon = L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  iconosCache.set(tipo, icon);
  return icon;
};

const MapaMultiAlertas = ({ alertas = [], onSeleccionarAlerta, altura = '500px', geocercaTenant = null }) => {
  const containerRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadoresRef = useRef(new Map());
  const [error, setError] = useState(null);
  const [inicializando, setInicializando] = useState(true);

  const alertasValidas = useMemo(() => {
    return alertas.filter(a => {
      const lat = parseFloat(a.lat);
      const lng = parseFloat(a.lng);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
  }, [alertas]);

  const centroMapa = useMemo(() => {
    // Si hay alertas, centrar en ellas
    if (alertasValidas.length > 0) {
      const latMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lat), 0) / alertasValidas.length;
      const lngMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lng), 0) / alertasValidas.length;
      return { lat: latMedia, lng: lngMedia };
    }

    //  NUEVO: Si no hay alertas pero hay geocerca, centrar en el municipio
    if (geocercaTenant?.centro_lat && geocercaTenant?.centro_lng) {
      return {
        lat: parseFloat(geocercaTenant.centro_lat),
        lng: parseFloat(geocercaTenant.centro_lng)
      };
    }

    // Fallback: Ciudad de México
    return { lat: 19.4326, lng: -99.1332 };
  }, [alertasValidas, geocercaTenant]);

  const zoomInicial = useMemo(() => {
    if (alertasValidas.length > 0) return 12; // Se ajustará con fitBounds

    //  NUEVO: Si hay geocerca, calcular zoom según el tamaño
    if (geocercaTenant?.bbox_lat_min && geocercaTenant?.bbox_lat_max) {
      const latDiff = Math.abs(geocercaTenant.bbox_lat_max - geocercaTenant.bbox_lat_min);
      if (latDiff > 0.5) return 11;
      if (latDiff > 0.2) return 12;
      if (latDiff > 0.1) return 13;
      return 14;
    }

    return 12;
  }, [alertasValidas, geocercaTenant]);

  const crearPopupContent = useCallback((alerta) => {
    const fechaFormateada = alerta.fecha_creacion ? new Date(alerta.fecha_creacion).toLocaleString('es-MX') : 'Fecha desconocida';
    const estadoTexto = {
      activa: 'ACTIVA', asignada: 'ASIGNADA', atendiendo: 'ATENDIENDO',
      cerrada: 'CERRADA', expirada: 'EXPIRADA', confirmando: 'CONFIRMANDO'
    }[alerta.estado] || alerta.estado?.toUpperCase() || 'DESCONOCIDO';

    const estadoColor = {
      activa: 'bg-red-100 text-red-700', asignada: 'bg-blue-100 text-blue-700',
      atendiendo: 'bg-purple-100 text-purple-700', cerrada: 'bg-green-100 text-green-700',
      expirada: 'bg-gray-100 text-gray-700'
    }[alerta.estado] || 'bg-gray-100 text-gray-700';

    return renderToString(
      <div className="p-3 min-w-[220px] max-w-[280px]">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'}`}>
            {alerta.tipo === 'panico' ? <AlertTriangle size={14} className="text-red-600" /> : <Heart size={14} className="text-green-600" />}
          </div>
          <span className="font-semibold text-gray-800">ALERTA PRESENTADA</span>
        </div>
        <p className="text-sm text-gray-600 mb-2 truncate">{alerta.ciudadano?.nombre || 'Ciudadano desconocido'}</p>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">Estado:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${estadoColor}`}>{estadoTexto}</span>
          </div>

          {/*  TIPO CON ÍCONO */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Tipo:</span>
            {alerta.tipo === 'panico' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertTriangle size={12} />
                Pánico
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <Heart size={12} />
                Médica
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="font-medium">Fecha:</span>
            <span className="text-xs">{fechaFormateada}</span>
          </div>
        </div>
      </div>
    );
  }, [onSeleccionarAlerta]);

  // Inicializar el mapa cuando el contenedor esté listo
  useEffect(() => {
    if (!containerRef.current) {
      console.log(' [MapaMultiAlertas] containerRef aún no disponible');
      return;
    }

    if (mapaInstancia.current) {
      console.log(' [MapaMultiAlertas] Mapa ya inicializado');
      return;
    }

    console.log(' [MapaMultiAlertas] Inicializando mapa...');

    try {
      const mapa = L.map(containerRef.current).setView([centroMapa.lat, centroMapa.lng], zoomInicial);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
        detectRetina: true
      }).addTo(mapa);

      //  NUEVO: Limitar el mapa al bounding box del municipio
      if (geocercaTenant?.bbox_lat_min && geocercaTenant?.bbox_lat_max &&
        geocercaTenant?.bbox_lng_min && geocercaTenant?.bbox_lng_max) {
        const southWest = L.latLng(
          parseFloat(geocercaTenant.bbox_lat_min),
          parseFloat(geocercaTenant.bbox_lng_min)
        );
        const northEast = L.latLng(
          parseFloat(geocercaTenant.bbox_lat_max),
          parseFloat(geocercaTenant.bbox_lng_max)
        );
        const bounds = L.latLngBounds(southWest, northEast);
        mapa.setMaxBounds(bounds);
        mapa.setMinZoom(10);
        console.log(' Mapa limitado al municipio:', geocercaTenant.nombre);
      }

      mapaInstancia.current = mapa;
      setInicializando(false);
      console.log(' [MapaMultiAlertas] Mapa inicializado correctamente');

      setTimeout(() => {
        if (mapaInstancia.current) {
          mapaInstancia.current.invalidateSize();
        }
      }, 200);

    } catch (err) {
      console.error(' [MapaMultiAlertas] Error inicializando mapa:', err);
      setError(err.message);
      setInicializando(false);
    }
  }, [centroMapa.lat, centroMapa.lng, zoomInicial, geocercaTenant]);

  // Agregar marcadores cuando el mapa esté listo
  useEffect(() => {
    if (inicializando || !mapaInstancia.current) return;

    console.log(' [MapaMultiAlertas] Agregando marcadores, alertas:', alertasValidas.length);

    marcadoresRef.current.forEach((marcador) => {
      if (mapaInstancia.current) {
        mapaInstancia.current.removeLayer(marcador);
      }
    });
    marcadoresRef.current.clear();

    alertasValidas.forEach(alerta => {
      const lat = parseFloat(alerta.lat);
      const lng = parseFloat(alerta.lng);
      const icono = getCustomIcon(alerta.tipo);

      try {
        const marcador = L.marker([lat, lng], { icon: icono }).addTo(mapaInstancia.current);
        marcador.bindPopup(crearPopupContent(alerta));
        marcador.on('click', () => {
          if (onSeleccionarAlerta) onSeleccionarAlerta(alerta);
        });
        marcadoresRef.current.set(alerta.id, marcador);
      } catch (err) {
        console.error('Error creando marcador:', err);
      }
    });

    if (alertasValidas.length > 0) {
      const bounds = L.latLngBounds(alertasValidas.map(a => [parseFloat(a.lat), parseFloat(a.lng)]));
      if (bounds.isValid()) {
        mapaInstancia.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

  }, [alertasValidas, inicializando, crearPopupContent, onSeleccionarAlerta]);

  // Manejar resize
  useEffect(() => {
    const handleResize = () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
      }
      marcadoresRef.current.clear();
    };
  }, []);

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="w-full bg-red-50 rounded-xl flex flex-col items-center justify-center border border-red-200" style={{ height: altura, minHeight: '300px' }}>
        <AlertTriangle size={32} className="text-red-500 mb-2" />
        <p className="text-red-600 text-sm font-medium">Error al cargar el mapa</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden bg-gray-100"
      style={{ height: altura, minHeight: '300px' }}
    />
  );
};

export default MapaMultiAlertas;