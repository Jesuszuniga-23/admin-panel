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

// ✅ Memoizar iconos por tipo para no recrearlos en cada render
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
  const marcadoresRef = useRef(new Map()); // Usar Map para mejor gestión
  const grupoMarcadoresRef = useRef(null);
  const initializadoRef = useRef(false);

  // ✅ Validar y calcular centro del mapa
  const centroMapa = useMemo(() => {
    const alertasValidas = alertas.filter(a => a.lat && a.lng && !isNaN(a.lat) && !isNaN(a.lng));
    
    if (alertasValidas.length === 0) {
      return { lat: 19.4326, lng: -99.1332 }; // Centro de CDMX por defecto
    }
    
    const latMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lat), 0) / alertasValidas.length;
    const lngMedia = alertasValidas.reduce((sum, a) => sum + parseFloat(a.lng), 0) / alertasValidas.length;
    
    // ✅ Validar que no sean NaN
    if (isNaN(latMedia) || isNaN(lngMedia)) {
      return { lat: 19.4326, lng: -99.1332 };
    }
    
    return { lat: latMedia, lng: lngMedia };
  }, [alertas]);

  // ✅ Función para crear popup (memoizada)
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

  // ✅ Inicializar mapa (solo una vez)
  useEffect(() => {
    if (!mapaRef.current || initializadoRef.current) return;

    try {
      // Crear mapa con centro por defecto
      const mapa = L.map(mapaRef.current).setView([centroMapa.lat, centroMapa.lng], 12);
      mapaInstancia.current = mapa;

      // Capa base
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapa);

      // Grupo de marcadores
      const grupo = L.layerGroup().addTo(mapa);
      grupoMarcadoresRef.current = grupo;
      
      initializadoRef.current = true;
      
      // ✅ Manejar cambio de tamaño de ventana
      const handleResize = () => {
        if (mapaInstancia.current) {
          setTimeout(() => {
            mapaInstancia.current.invalidateSize();
          }, 100);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mapaInstancia.current) {
          mapaInstancia.current.remove();
          mapaInstancia.current = null;
        }
        marcadoresRef.current.clear();
        initializadoRef.current = false;
      };
    } catch (error) {
      console.error('Error inicializando mapa múltiple:', error);
      initializadoRef.current = false;
    }
  }, []); // ✅ Solo se ejecuta una vez

  // ✅ Actualizar marcadores cuando cambian las alertas
  useEffect(() => {
    if (!mapaInstancia.current || !grupoMarcadoresRef.current) return;

    // Filtrar alertas válidas
    const alertasValidas = alertas.filter(a => 
      a.lat && a.lng && !isNaN(parseFloat(a.lat)) && !isNaN(parseFloat(a.lng))
    );

    // ✅ Crear conjunto de IDs actuales
    const idsActuales = new Set(alertasValidas.map(a => a.id));
    
    // ✅ Eliminar marcadores que ya no existen
    marcadoresRef.current.forEach((marcador, id) => {
      if (!idsActuales.has(id)) {
        grupoMarcadoresRef.current.removeLayer(marcador);
        marcadoresRef.current.delete(id);
      }
    });
    
    // ✅ Agregar o actualizar marcadores
    alertasValidas.forEach(alerta => {
      const marcadorExistente = marcadoresRef.current.get(alerta.id);
      const lat = parseFloat(alerta.lat);
      const lng = parseFloat(alerta.lng);
      
      if (marcadorExistente) {
        // Actualizar posición si cambió
        const posActual = marcadorExistente.getLatLng();
        if (posActual.lat !== lat || posActual.lng !== lng) {
          marcadorExistente.setLatLng([lat, lng]);
        }
        // Actualizar popup
        const nuevoPopup = crearPopupContent(alerta);
        marcadorExistente.bindPopup(nuevoPopup);
      } else {
        // Crear nuevo marcador
        const icono = getCustomIcon(alerta.tipo);
        const marcador = L.marker([lat, lng], { icon: icono }).addTo(grupoMarcadoresRef.current);
        
        // Popup
        const popupContent = crearPopupContent(alerta);
        marcador.bindPopup(popupContent);
        
        // Evento de clic
        marcador.on('click', () => {
          if (onSeleccionarAlerta) {
            onSeleccionarAlerta(alerta);
          }
        });
        
        marcadoresRef.current.set(alerta.id, marcador);
      }
    });
    
    // ✅ Ajustar vista si es necesario (solo si hay alertas)
    if (alertasValidas.length > 0 && centroMapa.lat && centroMapa.lng) {
      const bounds = L.latLngBounds(
        alertasValidas.map(a => [parseFloat(a.lat), parseFloat(a.lng)])
      );
      
      if (bounds.isValid()) {
        mapaInstancia.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapaInstancia.current.setView([centroMapa.lat, centroMapa.lng], 12);
      }
    }
    
  }, [alertas, onSeleccionarAlerta, crearPopupContent, centroMapa]);

  // ✅ Mensaje cuando no hay alertas válidas
  const alertasValidas = useMemo(() => 
    alertas.filter(a => a.lat && a.lng && !isNaN(a.lat) && !isNaN(a.lng)),
    [alertas]
  );

  if (alertasValidas.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center flex-col">
        <AlertTriangle size={32} className="text-gray-400 mb-2" />
        <p className="text-gray-400 text-sm">No hay ubicaciones para mostrar</p>
        <p className="text-xs text-gray-300 mt-1">Total alertas: {alertas.length}</p>
      </div>
    );
  }

  return <div ref={mapaRef} className="w-full h-full" style={{ minHeight: '300px' }} />;
};

export default MapaMultiAlertas;