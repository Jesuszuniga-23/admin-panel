import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Calendar, User, MapPin,
  AlertTriangle, Clock, X
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';

// Función para normalizar texto (corregir acentos y caracteres especiales)
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

const AlertasExpiradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
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

  useEffect(() => {
    cargarAlertas();
  }, []); // Solo cargar una vez

  // Función para filtrar datos localmente
  const filtrarDatos = (datos) => {
    return datos.filter(item => {
      
      // BUSCADOR 
      if (filtros.search) {
        const termino = filtros.search.toLowerCase().trim();
        
        // Búsqueda por ID
        const idMatch = item.id?.toString().includes(termino);
        
        // Búsqueda por tipo de alerta
        const tipoMatch = item.tipo?.toLowerCase().includes(termino) ||
                         (termino === 'panico' && item.tipo === 'panico') ||
                         (termino === 'pánico' && item.tipo === 'panico') ||
                         (termino === 'medica' && item.tipo === 'medica') ||
                         (termino === 'médica' && item.tipo === 'medica');
        
        // Búsqueda por ciudadano
        const ciudadanoMatch = item.ciudadano?.nombre?.toLowerCase().includes(termino);
        
        if (!idMatch && !tipoMatch && !ciudadanoMatch) {
          return false;
        }
      }
      
      // FILTRO DE FECHAS 
      if (filtros.desde && filtros.hasta) {
        const fechaCreacion = new Date(item.fecha_creacion);
        
        // Crear fechas con zona horaria local
        const desdeParts = filtros.desde.split('-');
        const hastaParts = filtros.hasta.split('-');
        
        const desde = new Date(
          parseInt(desdeParts[0]), 
          parseInt(desdeParts[1]) - 1, 
          parseInt(desdeParts[2]),
          0, 0, 0, 0
        );
        
        const hasta = new Date(
          parseInt(hastaParts[0]), 
          parseInt(hastaParts[1]) - 1, 
          parseInt(hastaParts[2]),
          23, 59, 59, 999
        );
        
        if (fechaCreacion < desde || fechaCreacion > hasta) {
          return false;
        }
      } else {
        if (filtros.desde) {
          const desdeParts = filtros.desde.split('-');
          const desde = new Date(
            parseInt(desdeParts[0]), 
            parseInt(desdeParts[1]) - 1, 
            parseInt(desdeParts[2]),
            0, 0, 0, 0
          );
          const fechaCreacion = new Date(item.fecha_creacion);
          if (fechaCreacion < desde) return false;
        }
        
        if (filtros.hasta) {
          const hastaParts = filtros.hasta.split('-');
          const hasta = new Date(
            parseInt(hastaParts[0]), 
            parseInt(hastaParts[1]) - 1, 
            parseInt(hastaParts[2]),
            23, 59, 59, 999
          );
          const fechaCreacion = new Date(item.fecha_creacion);
          if (fechaCreacion > hasta) return false;
        }
      }
      
      return true;
    });
  };

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      // Traer todas las alertas sin filtros
      const resultado = await alertasService.obtenerExpiradas({ limite: 1000 });
      
      // Formatear nombres de ciudadanos
      const alertasFormateadas = (resultado.data || []).map(alerta => ({
        ...alerta,
        ciudadano: alerta.ciudadano ? {
          ...alerta.ciudadano,
          nombre: formatearNombre(alerta.ciudadano.nombre)
        } : null
      }));
      
      setAlertasOriginal(alertasFormateadas);
      
      // Aplicar filtros iniciales
      aplicarFiltrosLocal(alertasFormateadas);
      
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    const datosFiltrados = filtrarDatos(datos);
    
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const handleLimpiarBusqueda = () => {
    setSearchInput('');
    setFiltros(prev => ({ ...prev, search: '', pagina: 1 }));
  };

  const aplicarFiltros = () => {
    setFiltros(prev => ({ ...prev, pagina: 1 }));
    aplicarFiltrosLocal();
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

  // Función para abrir el modal del mapa
  const abrirMapaModal = (e, alerta) => {
    e.stopPropagation(); // Evitar que se active el clic en la fila
    setMapaModal({
      abierto: true,
      lat: alerta.lat,
      lng: alerta.lng,
      titulo: alerta.tipo === 'panico' ? 'Alerta de Pánico' : 'Alerta Médica',
      alertaId: alerta.id,
      tipo: alerta.tipo
    });
  };

  // Función para cerrar el modal
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

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros.search, filtros.desde, filtros.hasta, filtros.pagina]);

  const handleRowClick = (alertaId) => {
    navigate(`/admin/alertas/expiradas/${alertaId}`); 
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

  if (cargando && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-3 text-sm text-slate-500">Cargando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - RESPONSIVE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-amber-200">
              <AlertTriangle size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Expiradas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Alertas que no fueron atendidas a tiempo</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Dashboard</span>
            <span className="xs:hidden">Dashboard</span>
          </button>
        </div>

        {/* Panel de filtros - RESPONSIVE */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Filter size={14} className="sm:w-4 sm:h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Filtros</span>
            <span className="text-xs bg-amber-50 text-amber-600 px-1.5 sm:px-2 py-0.5 rounded-full ml-2">
              Búsqueda por tipo
            </span>
          </div>
          
          {/* Grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Buscador mejorado */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, tipo (pánico/médica) o ciudadano..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs sm:text-sm"
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

            {/* Fecha desde */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros({...filtros, desde: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros({...filtros, hasta: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
              <button
                onClick={aplicarFiltros}
                className="flex-1 px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg md:rounded-xl shadow-sm shadow-amber-200 hover:bg-amber-700 hover:shadow-md transition-all text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Aplicar
              </button>
              <button
                onClick={limpiarFiltros}
                className="flex-1 px-3 sm:px-4 py-2 border border-slate-200 bg-white rounded-lg md:rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap"
              >
                Limpiar
              </button>
            </div>
          </div>

          {(filtros.desde || filtros.hasta || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              <span className="text-amber-600">Filtros aplicados - {paginacion.total} resultados</span>
              
            </div>
          )}
        </div>

        {/* Tabla - RESPONSIVE con scroll horizontal */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {cargando ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600"></div>
              <p className="mt-3 text-xs sm:text-sm text-slate-500">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-8 md:p-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} className="md:w-7 md:h-7 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-base font-medium text-slate-700 mb-1">No hay alertas expiradas</h3>
              <p className="text-xs text-slate-400">Todas las alertas han sido atendidas a tiempo</p>
            </div>
          ) : (
            <>
              {/* Scroll horizontal en móvil */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] md:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">TIPO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">CIUDADANO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">UBICACIÓN</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">FECHA</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id} 
                        onClick={() => handleRowClick(alerta.id)}
                        className="hover:bg-amber-50/50 cursor-pointer transition-colors"
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
                          {alerta.lat && alerta.lng ? (
                            <button
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded-lg transition-all group"
                              title="Ver ubicación en mapa"
                            >
                              <MapPin size={16} className="md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
                              <span className="text-xs hidden md:inline">Ver mapa</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Clock size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[70px] md:max-w-[120px]">
                              {formatearFecha(alerta.fecha_creacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-100 text-slate-600 rounded-full">
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            <span className="hidden md:inline">Expirada</span>
                            <span className="md:hidden">Exp</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-600">
                  Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de{' '}
                  <span className="font-medium">{paginacion.total}</span> registros
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-amber-50 hover:border-amber-200 disabled:opacity-50 transition-colors"
                  >
                    Anterior
                  </button>
                  
                  <span className="px-3 py-1.5 text-xs sm:text-sm text-slate-600">
                    Página <span className="font-medium">{paginacion.pagina}</span> de{' '}
                    <span className="font-medium">{paginacion.total_paginas}</span>
                  </span>
                  
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-amber-50 hover:border-amber-200 disabled:opacity-50 transition-colors"
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  mapaModal.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {mapaModal.tipo === 'panico' ? (
                    <AlertTriangle size={18} className="text-red-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-green-600" />
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
                        <AlertTriangle size={14} className="text-green-500" />
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
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
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

export default AlertasExpiradas;