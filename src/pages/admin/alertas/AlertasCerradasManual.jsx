import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Calendar, User, MapPin,
  Shield, XCircle, Clock, X, AlertTriangle, Heart
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import useAuthStore from '../../../store/authStore';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';

// Función para normalizar texto 
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  const reemplazos = [
    { de: '¡', para: 'í' }, { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' },
    { de: '€', para: 'e' }, { de: '‚', para: 'é' }, { de: '¢', para: 'o' },
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã�', para: 'Á' },
    { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã±', para: 'ñ' }, { de: 'Ã‘', para: 'Ñ' },
    { de: 'Â¿', para: '¿' }, { de: 'Â¡', para: '¡' }
  ];
  
  let textoNormalizado = texto;
  reemplazos.forEach(({ de, para }) => {
    textoNormalizado = textoNormalizado.split(de).join(para);
  });
  
  return textoNormalizado;
};

// Función para formatear nombres
const formatearNombre = (nombre) => {
  if (!nombre) return '';
  const nombreNormalizado = normalizarTexto(nombre);
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const AlertasCerradasManual = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Estado para TODAS las alertas (sin filtrar)
  const [todasLasAlertas, setTodasLasAlertas] = useState([]);
  
  // Estado para las alertas filtradas y paginadas
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el modal del mapa
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });
  
  // FILTROS
  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1,
    desde: '',
    hasta: '',
    search: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  // =====================================================
  // CARGAR TODAS LAS ALERTAS (UNA SOLA VEZ)
  // =====================================================
  useEffect(() => {
    cargarTodasLasAlertas();
  }, []);

  const cargarTodasLasAlertas = async () => {
    setCargando(true);
    try {
      // Traer TODAS las alertas sin filtros
      const resultado = await alertasService.obtenerCerradasManual({ limite: 1000 });
      
      // Formatear datos para visualización
      const alertasFormateadas = (resultado.data || []).map(alerta => ({
        ...alerta,
        ciudadano: alerta.ciudadano ? {
          ...alerta.ciudadano,
          nombre: formatearNombre(alerta.ciudadano.nombre)
        } : null,
        cerrador: alerta.cerrador ? {
          ...alerta.cerrador,
          nombre: formatearNombre(alerta.cerrador.nombre)
        } : null
      }));
      
      setTodasLasAlertas(alertasFormateadas);
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  // =====================================================
  // FILTRADO LOCAL (CADA VEZ QUE CAMBIAN LOS FILTROS)
  // =====================================================
  useEffect(() => {
    if (todasLasAlertas.length === 0) return;
    
    aplicarFiltrosYOrden();
  }, [filtros, todasLasAlertas]);

  const aplicarFiltrosYOrden = () => {
    // 1. FILTRAR POR BÚSQUEDA (texto)
    let datosFiltrados = [...todasLasAlertas];
    
    if (filtros.search) {
      const busqueda = filtros.search.toLowerCase().trim();
      datosFiltrados = datosFiltrados.filter(alerta => {
        // Buscar en varios campos
        const idMatch = alerta.id?.toString().includes(busqueda);
        const tipoMatch = alerta.tipo?.toLowerCase().includes(busqueda);
        const ciudadanoMatch = alerta.ciudadano?.nombre?.toLowerCase().includes(busqueda);
        const motivoMatch = alerta.motivo_cierre_manual?.toLowerCase().includes(busqueda);
        const cerradorMatch = alerta.cerrador?.nombre?.toLowerCase().includes(busqueda);
        
        return idMatch || tipoMatch || ciudadanoMatch || motivoMatch || cerradorMatch;
      });
    }
    
    // 2. FILTRAR POR FECHA (local)
    if (filtros.desde && filtros.hasta) {
      const desde = new Date(filtros.desde);
      desde.setHours(0, 0, 0, 0);
      
      const hasta = new Date(filtros.hasta);
      hasta.setHours(23, 59, 59, 999);
      
      console.log('🔍 Filtrando desde:', desde.toLocaleString(), 'hasta:', hasta.toLocaleString());
      
      datosFiltrados = datosFiltrados.filter(alerta => {
        if (!alerta.fecha_cierre) return false;
        const fechaCierre = new Date(alerta.fecha_cierre);
        return fechaCierre >= desde && fechaCierre <= hasta;
      });
    }
    
    // 3. CALCULAR PAGINACIÓN
    const total = datosFiltrados.length;
    const totalPaginas = Math.ceil(total / filtros.limite);
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    
    setAlertas(datosPaginados);
    setPaginacion({
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      total_paginas: totalPaginas
    });
  };

  // Manejadores
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const handleLimpiarBusqueda = () => {
    setSearchInput('');
    setFiltros(prev => ({ ...prev, search: '', pagina: 1 }));
  };

  const handleFechaChange = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor, pagina: 1 }));
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const limpiarFiltros = () => {
    setSearchInput('');
    setFiltros({
      limite: 10,
      pagina: 1,
      desde: '',
      hasta: '',
      search: ''
    });
  };

  const abrirMapaModal = (e, alerta) => {
    e.stopPropagation();
    setMapaModal({
      abierto: true,
      lat: alerta.lat,
      lng: alerta.lng,
      titulo: alerta.tipo === 'panico' ? 'Alerta de Pánico' : 'Alerta Médica',
      alertaId: alerta.id,
      tipo: alerta.tipo
    });
  };

  const cerrarMapaModal = () => {
    setMapaModal({
      abierto: false,
      lat: null,
      lng: null,
      titulo: null,
      alertaId: null,
      tipo: null
    });
  };

  const handleRowClick = (alertaId) => {
    navigate(`/admin/alertas/${alertaId}`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-purple-200">
              <XCircle size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Cerradas Manualmente</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Historial de alertas cerradas por administradores</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Dashboard</span>
            <span className="xs:hidden">Dashboard</span>
          </button>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Filter size={14} className="sm:w-4 sm:h-4 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Filtros</span>
            <span className="text-xs bg-purple-50 text-purple-600 px-1.5 sm:px-2 py-0.5 rounded-full ml-2">
              Filtrado local
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Buscador */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, tipo, ciudadano, motivo..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs sm:text-sm"
                />
                {searchInput && (
                  <button
                    onClick={handleLimpiarBusqueda}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                  >
                    <X size={12} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Desde */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => handleFechaChange('desde', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Hasta */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => handleFechaChange('hasta', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Botón Limpiar */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-3 sm:px-4 py-2 border border-slate-200 bg-white rounded-lg md:rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {(filtros.desde || filtros.hasta || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
              <span className="text-purple-600">Filtros aplicados - {paginacion.total} resultados</span>
             
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {cargando ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="mt-3 text-xs sm:text-sm text-slate-500">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-8 md:p-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle size={24} className="md:w-7 md:h-7 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-base font-medium text-slate-700 mb-1">No hay alertas cerradas</h3>
              <p className="text-xs text-slate-400">
                {filtros.desde || filtros.hasta || filtros.search
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'Las alertas cerradas manualmente aparecerán aquí'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] md:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">TIPO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">CIUDADANO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">CERRADO POR</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">MOTIVO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">FECHA</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">UBICACIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id} 
                        onClick={() => handleRowClick(alerta.id)}
                        className="hover:bg-purple-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm text-slate-600">#{alerta.id}</td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                            alerta.tipo === 'panico' 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <User size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[80px] md:max-w-[150px]">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Shield size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[80px] md:max-w-[150px]">
                              {alerta.cerrador?.nombre || 'Admin'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className="text-xs md:text-sm text-slate-600 truncate block max-w-[80px] md:max-w-[200px]" title={alerta.motivo_cierre_manual}>
                            {alerta.motivo_cierre_manual || '—'}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Clock size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[70px] md:max-w-[120px]">
                              {formatearFecha(alerta.fecha_cierre)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          {alerta.lat && alerta.lng ? (
                            <button
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              className="flex items-center gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-lg transition-all group"
                              title="Ver ubicación en mapa"
                            >
                              <MapPin size={16} className="md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-xs hidden md:inline">Ver mapa</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-600">
                  Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de{' '}
                  <span className="font-medium">{paginacion.total}</span> registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-purple-50 hover:border-purple-200 disabled:opacity-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs sm:text-sm text-slate-600">
                    Página <span className="font-medium">{paginacion.pagina}</span> de{' '}
                    <span className="font-medium">{paginacion.total_paginas}</span>
                  </span>
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina + 1)}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-purple-50 hover:border-purple-200 disabled:opacity-50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL DEL MAPA */}
      {mapaModal.abierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={cerrarMapaModal}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  mapaModal.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {mapaModal.tipo === 'panico' ? (
                    <AlertTriangle size={18} className="text-red-600" />
                  ) : (
                    <Heart size={18} className="text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Ubicación de la Alerta</h3>
                  <p className="text-xs text-gray-500">ID: #{mapaModal.alertaId} • {mapaModal.titulo}</p>
                </div>
              </div>
              <button
                onClick={cerrarMapaModal}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Contenido del modal - Mapa */}
            <div className="p-4">
              <MapaConDireccion
                lat={mapaModal.lat}
                lng={mapaModal.lng}
                titulo={
                  <div className="flex items-center gap-1.5">
                    {mapaModal.tipo === 'panico' ? (
                      <>
                        <AlertTriangle size={14} className="text-red-500" />
                        <span className="text-xs font-medium text-gray-700">Alerta de Pánico</span>
                      </>
                    ) : (
                      <>
                        <Heart size={14} className="text-green-500" />
                        <span className="text-xs font-medium text-gray-700">Alerta Médica</span>
                      </>
                    )}
                  </div>
                }
                alertaId={mapaModal.alertaId}
                altura="400px"
              />
            </div>

            {/* Footer del modal */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={cerrarMapaModal}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasCerradasManual;