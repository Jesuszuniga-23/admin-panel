// src/components/maps/MapaMultiAlertas.jsx
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

const MapaMultiAlertas = ({ alertas = [], onSeleccionarAlerta, altura = '500px' }) => {
  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadoresRef = useRef(new Map());
  const grupoMarcadoresRef = useRef(null);
  const [mapaInicializado, setMapaInicializado] = useState(false);
  const [cargandoMapa, setCargandoMapa] = useState(true);
  const initTimeoutRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const alertasValidas = useMemo(() => {
    return alertas.filter(a => {
      const lat = parseFloat(a.lat);
      const lng = parseFloat(a.lng);
      return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    });
  }, [alertas]);

  const centroMapa = useMemo(() => {
    if (alertasValidas.length === 0) return { lat: 19.4326, lng: -99.1332 };
    const latMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lat), 0) / alertasValidas.length;
    const lngMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lng), 0) / alertasValidas.length;
    return { lat: latMedia, lng: lngMedia };
  }, [alertasValidas]);

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
          <span className="font-semibold text-gray-800">Alerta #{alerta.id}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2 truncate">{alerta.ciudadano?.nombre || 'Ciudadano desconocido'}</p>
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between"><span className="font-medium">Estado:</span><span className={`px-2 py-0.5 rounded-full text-xs ${estadoColor}`}>{estadoTexto}</span></div>
          <div className="flex items-center gap-1"><span className="font-medium">Tipo:</span><span>{alerta.tipo === 'panico' ? '🚨 Pánico' : '🚑 Médica'}</span></div>
          <div className="flex items-center gap-1"><span className="font-medium">Fecha:</span><span className="text-xs">{fechaFormateada}</span></div>
          <div className="flex items-center gap-1"><span className="font-medium">Ubicación:</span><span className="text-xs font-mono">{parseFloat(alerta.lat).toFixed(4)}, {parseFloat(alerta.lng).toFixed(4)}</span></div>
        </div>
        <button className="mt-2 w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1 border-t border-gray-100 pt-2" onClick={() => { if (onSeleccionarAlerta) onSeleccionarAlerta(alerta); }}>Ver detalles</button>
      </div>
    );
  }, [onSeleccionarAlerta]);

  // ✅ useEffect CORREGIDO con reintentos automáticos
  useEffect(() => {
    console.log('🔍 [MapaMultiAlertas] useEffect - mapaRef:', !!mapaRef.current);
    
    const inicializarMapa = () => {
      if (!mapaRef.current || mapaInicializado) {
        console.log('⚠️ [MapaMultiAlertas] No se inicializa - contenedor no listo o ya inicializado');
        return;
      }
      
      const rect = mapaRef.current.getBoundingClientRect();
      console.log('📐 [MapaMultiAlertas] Dimensiones:', rect.width, 'x', rect.height);
      
      if (rect.width === 0 || rect.height === 0) {
        retryCountRef.current++;
        if (retryCountRef.current < 5) {
          console.log(`⚠️ [MapaMultiAlertas] Sin dimensiones, reintento ${retryCountRef.current}/5...`);
          initTimeoutRef.current = setTimeout(inicializarMapa, 500);
        } else {
          console.error('❌ [MapaMultiAlertas] Máximos reintentos alcanzados, el contenedor no tiene dimensiones');
          setCargandoMapa(false);
        }
        return;
      }
      
      try {
        console.log('🗺️ [MapaMultiAlertas] Inicializando mapa...');
        const mapa = L.map(mapaRef.current, { center: [centroMapa.lat, centroMapa.lng], zoom: 12 });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapa);
        const grupo = L.layerGroup().addTo(mapa);
        grupoMarcadoresRef.current = grupo;
        mapaInstancia.current = mapa;
        setMapaInicializado(true);
        setCargandoMapa(false);
        console.log('✅ [MapaMultiAlertas] Mapa inicializado');
        setTimeout(() => { if (mapaInstancia.current) mapaInstancia.current.invalidateSize(); }, 200);
      } catch (error) {
        console.error('❌ Error:', error);
        setCargandoMapa(false);
      }
    };
    
    initTimeoutRef.current = setTimeout(inicializarMapa, 300);
    
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
      }
      setMapaInicializado(false);
    };
  }, [centroMapa.lat, centroMapa.lng]);

  // Actualizar marcadores
  useEffect(() => {
    if (!mapaInstancia.current || !grupoMarcadoresRef.current || !mapaInicializado) return;
    
    const idsActuales = new Set(alertasValidas.map(a => a.id));
    marcadoresRef.current.forEach((marcador, id) => {
      if (!idsActuales.has(id)) {
        grupoMarcadoresRef.current.removeLayer(marcador);
        marcadoresRef.current.delete(id);
      }
    });
    
    alertasValidas.forEach(alerta => {
      if (marcadoresRef.current.has(alerta.id)) return;
      const lat = parseFloat(alerta.lat), lng = parseFloat(alerta.lng);
      const icono = getCustomIcon(alerta.tipo);
      const marcador = L.marker([lat, lng], { icon: icono }).addTo(grupoMarcadoresRef.current);
      marcador.bindPopup(crearPopupContent(alerta));
      marcador.on('click', () => { if (onSeleccionarAlerta) onSeleccionarAlerta(alerta); });
      marcadoresRef.current.set(alerta.id, marcador);
    });
    
    if (alertasValidas.length > 0 && mapaInstancia.current) {
      const bounds = L.latLngBounds(alertasValidas.map(a => [parseFloat(a.lat), parseFloat(a.lng)]));
      if (bounds.isValid()) mapaInstancia.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [alertasValidas, mapaInicializado, crearPopupContent, onSeleccionarAlerta]);

  // Resize
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        if (mapaInstancia.current && mapaInicializado) mapaInstancia.current.invalidateSize();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, [mapaInicializado]);

  if (cargandoMapa) {
    return (
      <div className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center" style={{ height: altura, minHeight: '300px' }}>
        <Loader size={32} className="text-blue-600 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Cargando mapa...</p>
      </div>
    );
  }

  if (alertasValidas.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-xl flex flex-col items-center justify-center" style={{ height: altura, minHeight: '300px' }}>
        <AlertTriangle size={32} className="text-gray-400 mb-2" />
        <p className="text-gray-400 text-sm">No hay ubicaciones para mostrar</p>
        <p className="text-xs text-gray-300 mt-1">Total alertas: {alertas.length}</p>
      </div>
    );
  }

  return <div ref={mapaRef} className="w-full rounded-xl overflow-hidden" style={{ height: altura, minHeight: '300px' }} />;
};

export default MapaMultiAlertas;