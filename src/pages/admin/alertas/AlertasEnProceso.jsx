import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, MapPin, User, Phone, Clock, Eye, 
  Truck, AlertTriangle, Heart, Filter, Calendar,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
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
  }, []); // Solo cargar una vez

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerEnProceso({ limite: 1000 });
      
      if (response.success) {
        // Formatear datos
        const alertasFormateadas = (response.data || []).map(alerta => ({
          ...alerta,
          ciudadano: alerta.ciudadano ? {
            ...alerta.ciudadano,
            nombre: formatearNombre(alerta.ciudadano.nombre)
          } : null
        }));
        
        setAlertasOriginal(alertasFormateadas);
        
        // Extraer unidades únicas para el filtro
        const unidades = [...new Set(alertasFormateadas
          .filter(a => a.unidad?.codigo)
          .map(a => a.unidad.codigo))];
        setUnidadesDisponibles(unidades);
        
        // Aplicar filtros iniciales
        aplicarFiltrosLocal(alertasFormateadas);
      }
    } catch (error) {
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar datos localmente
  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    let datosFiltrados = datos;
    let filtrosAplicados = false;
    
    // Filtro por tipo de alerta
    if (filtros.tipo !== 'todos') {
      filtrosAplicados = true;
      datosFiltrados = datosFiltrados.filter(a => a.tipo === filtros.tipo);
    }
    
    // Filtro por unidad
    if (filtros.unidad !== 'todas') {
      filtrosAplicados = true;
      datosFiltrados = datosFiltrados.filter(a => a.unidad?.codigo === filtros.unidad);
    }
    
    // Filtro por fechas
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
    
    // Calcular paginación
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
    setPagina(1); // Resetear a primera página
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

  // Efecto para aplicar filtros cuando cambian
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header con estilo profesional */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg shadow-yellow-200">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas en Proceso</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span>Alertas siendo atendidas por unidades</span>
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
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600 text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={16} />
            Dashboard
          </button>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-yellow-50 rounded-lg">
              <Filter size={16} className="text-yellow-600" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Filtros</span>
            <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full ml-2">
              Tiempo real
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filtro por tipo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de alerta</label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
              >
                <option value="todos">Todos los tipos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>

            {/* Filtro por unidad */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Unidad</label>
              <select
                value={filtros.unidad}
                onChange={(e) => handleFiltroChange('unidad', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
              >
                <option value="todas">Todas las unidades</option>
                {unidadesDisponibles.map(unidad => (
                  <option key={unidad} value={unidad}>{unidad}</option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Desde</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => handleFiltroChange('desde', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Hasta</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Botón limpiar */}
            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-6 py-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {filtrosActivos && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
              <span className="text-yellow-600">Filtros aplicados</span>
              <button
                onClick={limpiarFiltros}
                className="text-xs text-yellow-600 hover:text-yellow-800 underline ml-2"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Lista de Alertas */}
        {alertas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay alertas en proceso</h3>
            <p className="text-sm text-gray-400">
              {filtrosActivos 
                ? 'No se encontraron alertas con los filtros seleccionados'
                : 'Las alertas asignadas aparecerán aquí'}
            </p>
          </div>
        ) : (
          <>
            {/* Indicador de resultados */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
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

            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div 
                  key={alerta.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden group"
                >
                  {/* Barra superior con información de tiempo */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-2 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        Asignada: {formatearFecha(alerta.fecha_asignacion)}
                      </span>
                    </div>
                    <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full">
                      {alerta.estado === 'asignada' ? 'En espera' : 'En atención'}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header con tipo y estado */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2.5 rounded-xl ${
                            alerta.tipo === 'panico' ? 'bg-red-50' : 'bg-green-50'
                          }`}>
                            {getIconByTipo(alerta.tipo)}
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getColorByTipo(alerta.tipo)}`}>
                            {alerta.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getEstadoColor(alerta.estado)}`}>
                            {alerta.estado === 'asignada' ? 'ASIGNADA' : 'ATENDIENDO'}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            #{alerta.id}
                          </span>
                        </div>

                        {/* Unidad asignada */}
                        {alerta.unidad && (
                          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
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

                        {/* Grid de información */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <User size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Ciudadano</p>
                              <p className="text-sm font-medium text-gray-800">
                                {alerta.ciudadano?.nombre || 'Desconocido'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Phone size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Teléfono</p>
                              <p className="text-sm font-medium text-gray-800">
                                {alerta.ciudadano?.telefono || 'N/A'}
                              </p>
                            </div>
                          </div>
                          
                          {alerta.lat && alerta.lng && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <MapPin size={16} className="text-gray-400" />
                              <div>
                                <p className="text-xs text-gray-500">Ubicación</p>
                                <p className="text-sm font-medium text-gray-800 font-mono">
                                  {alerta.lat.toFixed(4)}, {alerta.lng.toFixed(4)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de acción */}
                      <button
                        onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                        className="ml-4 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all group self-start"
                        title="Ver detalle completo"
                      >
                        <Eye size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación profesional */}
            {paginacion.total_paginas > 1 && (
              <div className="mt-8 bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Mostrando <span className="font-medium text-gray-700">{inicio}</span> a{' '}
                  <span className="font-medium text-gray-700">{fin}</span> de{' '}
                  <span className="font-medium text-gray-700">{paginacion.total}</span> alertas
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Anterior
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
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
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
                    className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
                  >
                    Siguiente
                    <ChevronRight size={16} />
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