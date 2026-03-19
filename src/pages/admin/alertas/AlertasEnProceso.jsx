import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, MapPin, User, Phone, Clock, Eye, 
  Truck, AlertTriangle, Heart, Filter, Calendar,
  ChevronLeft, ChevronRight, X, MapPinned
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader'; // Solo este Loader (el personalizado)
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';

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

const formatearNombre = (nombre) => {
  if (!nombre) return '';
  const nombreNormalizado = normalizarTexto(nombre);
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const AlertasEnProceso = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    total_paginas: 1
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    unidad: 'todas',
    desde: '',
    hasta: ''
  });
  
  const [filtrosActivos, setFiltrosActivos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState([]);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerEnProceso({ limite: 1000 });
      
      if (response.success) {
        const alertasFormateadas = (response.data || []).map(alerta => ({
          ...alerta,
          ciudadano: alerta.ciudadano ? {
            ...alerta.ciudadano,
            nombre: formatearNombre(alerta.ciudadano.nombre)
          } : null
        }));
        
        setAlertasOriginal(alertasFormateadas);
        
        const unidades = [...new Set(alertasFormateadas
          .filter(a => a.unidad?.codigo)
          .map(a => a.unidad.codigo))];
        setUnidadesDisponibles(unidades);
        
        aplicarFiltrosLocal(alertasFormateadas);
      }
    } catch (error) {
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    let datosFiltrados = datos;
    let filtrosAplicados = false;
    
    if (filtros.tipo !== 'todos') {
      filtrosAplicados = true;
      datosFiltrados = datosFiltrados.filter(a => a.tipo === filtros.tipo);
    }
    
    if (filtros.unidad !== 'todas') {
      filtrosAplicados = true;
      datosFiltrados = datosFiltrados.filter(a => a.unidad?.codigo === filtros.unidad);
    }
    
    if (filtros.desde && filtros.hasta) {
      filtrosAplicados = true;
      
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaAsignacion = new Date(item.fecha_asignacion);
        
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
        
        return fechaAsignacion >= desde && fechaAsignacion <= hasta;
      });
    }
    
    setFiltrosActivos(filtrosAplicados);
    
    const total = datosFiltrados.length;
    const totalPaginas = Math.ceil(total / 10);
    const inicio = (pagina - 1) * 10;
    const fin = inicio + 10;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    
    setAlertas(datosPaginados);
    setPaginacion({
      total,
      pagina,
      total_paginas: totalPaginas
    });
  };

  const handleFiltroChange = (nombre, valor) => {
    setFiltros(prev => ({ ...prev, [nombre]: valor }));
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: 'todos',
      unidad: 'todas',
      desde: '',
      hasta: ''
    });
    setPagina(1);
    setFiltrosActivos(false);
  };

  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros, pagina]);

  const cambiarPagina = (nuevaPagina) => {
    setPagina(nuevaPagina);
  };

  const getColorByTipo = (tipo) => {
    return tipo === 'panico' 
      ? 'bg-red-100 text-red-700 border-red-200' 
      : 'bg-green-100 text-green-700 border-green-200';
  };

  const getIconByTipo = (tipo) => {
    return tipo === 'panico' 
      ? <AlertTriangle size={16} className="text-red-500" />
      : <Heart size={16} className="text-green-500" />;
  };

  const getEstadoColor = (estado) => {
    return estado === 'asignada'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * 10) + 1 : 0;
  const fin = Math.min(paginacion.pagina * 10, paginacion.total);

  if (loading && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header con estilo profesional */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-yellow-200">
              <Activity size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Alertas en Proceso</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                <span>Alertas siendo atendidas</span>
                {filtrosActivos && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    {paginacion.total} resultados
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600 text-xs sm:text-sm font-medium"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 md:mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1 sm:p-1.5 bg-yellow-50 rounded-lg">
              <Filter size={14} className="sm:w-4 sm:h-4 text-yellow-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Filtros</span>
            <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full ml-2">
              Tiempo real
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Filtro por tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de alerta</label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-xs sm:text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>

            {/* Filtro por unidad */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
              <select
                value={filtros.unidad}
                onChange={(e) => handleFiltroChange('unidad', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-xs sm:text-sm"
              >
                <option value="todas">Todas las unidades</option>
                {unidadesDisponibles.map(unidad => (
                  <option key={unidad} value={unidad}>{unidad}</option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => handleFiltroChange('desde', e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Botón limpiar */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-200 bg-white rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-xs sm:text-sm font-medium text-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {filtrosActivos && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
              <span className="text-amber-600">Filtros aplicados - {paginacion.total} resultados</span>
              
            </div>
          )}
        </div>

        {/* Lista de Alertas */}
        {alertas.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 md:p-16 text-center border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={24} className="sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No hay alertas en proceso</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              {filtrosActivos 
                ? 'No se encontraron alertas con los filtros seleccionados'
                : 'Las alertas asignadas aparecerán aquí'}
            </p>
          </div>
        ) : (
          <>
            {/* Indicador de resultados */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs sm:text-sm text-gray-500">
                Mostrando <span className="font-medium text-gray-700">{inicio}</span> a{' '}
                <span className="font-medium text-gray-700">{fin}</span> de{' '}
                <span className="font-medium text-gray-700">{paginacion.total}</span> alertas
              </p>
              {filtrosActivos && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  <span className="text-xs text-yellow-600 font-medium">
                    Filtros activos
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6">
              {alertas.map((alerta) => (
                <div 
                  key={alerta.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
                >
                  {/* Barra superior con información de tiempo */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 md:px-6 py-2 border-b border-gray-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Clock size={12} className="sm:w-3.5 sm:h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        Asignada: {formatearFecha(alerta.fecha_asignacion)}
                      </span>
                    </div>
                    <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full self-start xs:self-auto">
                      {alerta.estado === 'asignada' ? 'En espera' : 'En atención'}
                    </span>
                  </div>

                  <div className="p-3 sm:p-4 md:p-6">
                    {/* Header con tipo y estado - responsive */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${
                        alerta.tipo === 'panico' ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        {getIconByTipo(alerta.tipo)}
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold border ${getColorByTipo(alerta.tipo)}`}>
                        {alerta.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA'}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${getEstadoColor(alerta.estado)}`}>
                        {alerta.estado === 'asignada' ? 'ASIGNADA' : 'ATENDIENDO'}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        #{alerta.id}
                      </span>
                    </div>

                    {/* Grid principal - responsive */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Columna izquierda: Información del ciudadano y unidad */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Unidad asignada */}
                        {alerta.unidad && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100">
                            <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Truck size={14} className="text-blue-600" />
                              UNIDAD ASIGNADA
                            </h3>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg">
                                <Truck size={18} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-800">{alerta.unidad.codigo}</p>
                                <p className="text-xs text-blue-600">Unidad {alerta.unidad.tipo}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Información del ciudadano */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-100">
                          <h3 className="text-xs font-semibold text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={14} className="text-purple-600" />
                            CIUDADANO
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-700 font-semibold">
                                  {alerta.ciudadano?.nombre?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{alerta.ciudadano?.nombre || 'Desconocido'}</p>
                                <p className="text-xs text-gray-500">Ciudadano</p>
                              </div>
                            </div>
                            
                            {alerta.ciudadano?.telefono && (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                                <Phone size={14} className="text-purple-500" />
                                <span className="text-sm text-gray-700">{alerta.ciudadano.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Coordenadas (solo para referencia) */}
                        {alerta.lat && alerta.lng && (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-gray-400" />
                              <span className="text-xs text-gray-500">Coordenadas:</span>
                              <span className="text-xs font-mono text-gray-700">
                                {parseFloat(alerta.lat).toFixed(4)}, {parseFloat(alerta.lng).toFixed(4)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Columna derecha: Mapa */}
                      <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 h-full">
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MapPinned size={14} className="text-blue-600" />
                            UBICACIÓN DEL EVENTO
                          </h3>

                          <div className="rounded-lg overflow-hidden border border-gray-200">
                            <MapaConDireccion
                              lat={alerta.lat}
                              lng={alerta.lng}
                              titulo={
                                <div className="flex items-center gap-1.5">
                                  {alerta.tipo === 'panico' ? (
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
                              alertaId={alerta.id}
                              altura={window.innerWidth < 640 ? "250px" : "280px"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer con botón de acción */}
                  <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs sm:text-sm font-medium text-gray-600 group"
                    >
                      <Eye size={14} className="sm:w-4 sm:h-4 group-hover:text-blue-600" />
                      <span>Ver detalle completo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación profesional */}
            {paginacion.total_paginas > 1 && (
              <div className="mt-6 sm:mt-8 bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-gray-500">
                  Mostrando <span className="font-medium text-gray-700">{inicio}</span> a{' '}
                  <span className="font-medium text-gray-700">{fin}</span> de{' '}
                  <span className="font-medium text-gray-700">{paginacion.total}</span> alertas
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
                  >
                    <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Anterior</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, paginacion.total_paginas))].map((_, i) => {
                      let paginaMostrar = i + 1;
                      if (paginacion.pagina > 3 && paginacion.total_paginas > 5) {
                        paginaMostrar = paginacion.pagina - 2 + i;
                      }
                      if (paginaMostrar <= paginacion.total_paginas) {
                        return (
                          <button
                            key={i}
                            onClick={() => cambiarPagina(paginaMostrar)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                              paginacion.pagina === paginaMostrar
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {paginaMostrar}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina + 1)}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
                  >
                    <span className="hidden xs:inline">Siguiente</span>
                    <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertasEnProceso;