// src/components/maps/MapaMultiAlertas.jsx
import { useEffect, useRef, useCallback, useMemo } from 'react';
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

// Memoizar iconos por tipo
const iconosCache = new Map();

const getCustomIcon = (tipo) => {
  if (iconosCache.has(tipo)) {
    return iconosCache.get(tipo);
  }
  
  const color = tipo === 'panico' ? '#ef4444' : '#10b981';
  const IconComponent = tipo === 'panico' ? AlertTriangle : Heart;
  
  const iconHtml = renderToString(
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white`}
         style={{ backgroundColor: color }}>
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

const MapaMultiAlertas = ({ alertas = [], onSeleccionarAlerta }) => {
  const mapaRef = useRef(null);
  const mapaInstancia = useRef(null);
  const marcadoresRef = useRef(new Map());
  const grupoMarcadoresRef = useRef(null);
  const initializadoRef = useRef(false);
  const resizeTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Validar alertas válidas
  const alertasValidas = useMemo(() => 
    alertas.filter(a => a.lat && a.lng && !isNaN(parseFloat(a.lat)) && !isNaN(parseFloat(a.lng))),
    [alertas]
  );

  // Calcular centro del mapa
  const centroMapa = useMemo(() => {
    if (alertasValidas.length === 0) {
      return { lat: 19.4326, lng: -99.1332 };
    }
    
    const latMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lat), 0) / alertasValidas.length;
    const lngMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lng), 0) / alertasValidas.length;
    
    if (isNaN(latMedia) || isNaN(lngMedia)) {
      return { lat: 19.4326, lng: -99.1332 };
    }
    
    return { lat: latMedia, lng: lngMedia };
  }, [alertasValidas]);

  // Función para crear popup
  const crearPopupContent = useCallback((alerta) => {
    return renderToString(
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
              alerta.estado === 'expirada' ? 'bg-gray-100 text-gray-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {alerta.estado === 'activa' ? 'ACTIVA' :
               alerta.estado === 'cerrada' ? 'CERRADA' :
               alerta.estado === 'expirada' ? 'EXPIRADA' :
               alerta.estado?.toUpperCase() || 'DESCONOCIDO'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Tipo:</span>
            <span>{alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Coordenadas:</span>
            <span className="text-xs font-mono">
              {parseFloat(alerta.lat).toFixed(4)}, {parseFloat(alerta.lng).toFixed(4)}
            </span>
          </div>
        </div>
      </div>
    );
  }, []);

  // ✅ INICIALIZAR MAPA - CON VERIFICACIÓN DE QUE EL CONTENEDOR EXISTE
  useEffect(() => {
    isMountedRef.current = true;
    
    // Pequeño delay para asegurar que el contenedor está en el DOM
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (!mapaRef.current || initializadoRef.current) return;
      
      // Verificar que el contenedor tiene dimensiones
      const rect = mapaRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Contenedor del mapa aún no tiene dimensiones, reintentando...');
        return;
      }

      try {
        const mapa = L.map(mapaRef.current).setView([centroMapa.lat, centroMapa.lng], 12);
        mapaInstancia.current = mapa;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(mapa);

        const grupo = L.layerGroup().addTo(mapa);
        grupoMarcadoresRef.current = grupo;
        
        initializadoRef.current = true;
        
        // Forzar actualización de tamaño
        setTimeout(() => {
          if (mapaInstancia.current) {
            mapaInstancia.current.invalidateSize();
          }
        }, 100);
        
      } catch (error) {
        console.error('Error inicializando mapa:', error);
        initializadoRef.current = false;
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isMountedRef.current = false;
    };
  }, []); // ✅ Dependencias vacías - solo inicializa una vez

  // ✅ ACTUALIZAR MARCADORES CUANDO CAMBIAN LAS ALERTAS
  useEffect(() => {
    if (!mapaInstancia.current || !grupoMarcadoresRef.current || !initializadoRef.current) return;
    if (alertasValidas.length === 0) return;

    const idsActuales = new Set(alertasValidas.map(a => a.id));
    
    // Remover marcadores que ya no existen
    marcadoresRef.current.forEach((marcador, id) => {
      if (!idsActuales.has(id)) {
        grupoMarcadoresRef.current.removeLayer(marcador);
        marcadoresRef.current.delete(id);
      }
    });
    
    // Agregar o actualizar marcadores
    alertasValidas.forEach(alerta => {
      const marcadorExistente = marcadoresRef.current.get(alerta.id);
      const lat = parseFloat(alerta.lat);
      const lng = parseFloat(alerta.lng);
      
      if (marcadorExistente) {
        const posActual = marcadorExistente.getLatLng();
        if (posActual.lat !== lat || posActual.lng !== lng) {
          marcadorExistente.setLatLng([lat, lng]);
        }
        const nuevoPopup = crearPopupContent(alerta);
        marcadorExistente.bindPopup(nuevoPopup);
      } else {
        const icono = getCustomIcon(alerta.tipo);
        const marcador = L.marker([lat, lng], { icon: icono }).addTo(grupoMarcadoresRef.current);
        
        const popupContent = crearPopupContent(alerta);
        marcador.bindPopup(popupContent);
        
        marcador.on('click', () => {
          if (onSeleccionarAlerta) {
            onSeleccionarAlerta(alerta);
          }
        });
        
        marcadoresRef.current.set(alerta.id, marcador);
      }
    });
    
    // Ajustar vista para mostrar todos los marcadores
    if (alertasValidas.length > 0) {
      const bounds = L.latLngBounds(
        alertasValidas.map(a => [parseFloat(a.lat), parseFloat(a.lng)])
      );
      
      if (bounds.isValid()) {
        mapaInstancia.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
  }, [alertasValidas, onSeleccionarAlerta, crearPopupContent]);

  // ✅ MANEJAR RESIZE DE VENTANA
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (mapaInstancia.current && initializadoRef.current) {
          mapaInstancia.current.invalidateSize();
        }
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // ✅ LIMPIEZA AL DESMONTAR
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (mapaInstancia.current) {
        mapaInstancia.current.remove();
        mapaInstancia.current = null;
      }
      marcadoresRef.current.clear();
      initializadoRef.current = false;
    };
  }, []);

  // Mostrar placeholder si no hay alertas válidas
  if (alertasValidas.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center flex-col">
        <AlertTriangle size={32} className="text-gray-400 mb-2" />
        <p className="text-gray-400 text-sm">No hay ubicaciones para mostrar</p>
        <p className="text-xs text-gray-300 mt-1">Total alertas: {alertas.length}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapaRef} 
      className="w-full h-full" 
      style={{ minHeight: '500px', width: '100%' }}
    />
  );
};

export default MapaMultiAlertas;