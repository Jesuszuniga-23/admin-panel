// src/pages/admin/alertas/AlertasEnProceso.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, Filter, Calendar, ChevronLeft, ChevronRight,
  Eye, Clock, MapPin, User, Phone, Truck
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import { BadgeTipoAlerta, BotonMapa, ModalMapa } from '../../../components/ui/IconoEntidad';
import toast from 'react-hot-toast';
import authService from '../../../services/auth.service';

// Función para normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
    { de: '¡', para: 'í' }, { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
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
  
  // Obtener tipo de alerta permitido según rol
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });
  
  const [filtros, setFiltros] = useState({
    tipo: tipoAlertaPermitido || 'todos',
    unidad: 'todas',
    desde: '',
    hasta: '',
    pagina: 1,
    limite: 10
  });
  
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    total_paginas: 1
  });
  
  const [unidadesDisponibles, setUnidadesDisponibles] = useState([]);
  const [filtrosActivos, setFiltrosActivos] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const params = {};
      if (tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
      }
      
      const response = await alertasPanelService.obtenerEnProceso({ limite: 1000, ...params });
      
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
    
    if (filtros.tipo !== 'todos' && filtros.tipo) {
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
    const totalPaginas = Math.ceil(total / filtros.limite);
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    
    setAlertas(datosPaginados);
    setPaginacion({
      total,
      pagina: filtros.pagina,
      total_paginas: totalPaginas
    });
  };

  const handleFiltroChange = (nombre, valor) => {
    setFiltros(prev => ({ ...prev, [nombre]: valor, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: tipoAlertaPermitido || 'todos',
      unidad: 'todas',
      desde: '',
      hasta: '',
      pagina: 1,
      limite: 10
    });
    setFiltrosActivos(false);
  };

  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros.tipo, filtros.unidad, filtros.desde, filtros.hasta, filtros.pagina]);

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

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTiempoEnProceso = (fechaAsignacion) => {
    if (!fechaAsignacion) return 'N/A';
    const minutos = Math.floor((new Date() - new Date(fechaAsignacion)) / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * filtros.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * filtros.limite, paginacion.total);

  if (loading && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-3 rounded-xl shadow-lg shadow-yellow-200">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas en Proceso</h1>
              <p className="text-sm text-gray-500 mt-1">
                {paginacion.total} {paginacion.total === 1 ? 'alerta siendo' : 'alertas siendo'} atendidas
                {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros</span>
            {filtrosActivos && (
              <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full ml-2">
                {paginacion.total} resultados
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de alerta</label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
                disabled={!!tipoAlertaPermitido}
              >
                <option value="todos">Todos los tipos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidad asignada</label>
              <select
                value={filtros.unidad}
                onChange={(e) => handleFiltroChange('unidad', e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
              >
                <option value="todas">Todas las unidades</option>
                {unidadesDisponibles.map(unidad => (
                  <option key={unidad} value={unidad}>{unidad}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => handleFiltroChange('desde', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => handleFiltroChange('hasta', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-6 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Alertas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader />
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay alertas en proceso</h3>
              <p className="text-sm text-gray-400">
                {filtrosActivos
                  ? 'No se encontraron alertas con los filtros seleccionados'
                  : 'Las alertas asignadas aparecerán aquí'}
                {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIPO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIUDADANO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UNIDAD ASIGNADA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UBICACIÓN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIEMPO EN PROCESO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">FECHA ASIGNACIÓN</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id}
                        onClick={() => handleRowClick(alerta.id)}
                        className="hover:bg-yellow-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <BadgeTipoAlerta tipo={alerta.tipo} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                            {alerta.ciudadano?.telefono && (
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                {alerta.ciudadano.telefono}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {alerta.unidad ? (
                            <div className="flex items-center gap-1.5">
                              <Truck size={14} className="text-blue-500" />
                              <span className="text-sm font-medium text-blue-700">
                                {alerta.unidad.codigo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {alerta.lat && alerta.lng ? (
                            <BotonMapa
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              texto="Ver mapa"
                              size={14}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-amber-500" />
                            <span className="text-sm font-semibold text-amber-600">
                              {calcularTiempoEnProceso(alerta.fecha_asignacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatearFechaHora(alerta.fecha_asignacion)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(alerta.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginacion.total_paginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    Mostrando <span className="font-medium">{inicio}</span> a{' '}
                    <span className="font-medium">{fin}</span> de{' '}
                    <span className="font-medium">{paginacion.total}</span> alertas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFiltroChange('pagina', filtros.pagina - 1)}
                      disabled={paginacion.pagina === 1}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                    
                    <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                      Página {paginacion.pagina} de {paginacion.total_paginas}
                    </span>
                    
                    <button
                      onClick={() => handleFiltroChange('pagina', filtros.pagina + 1)}
                      disabled={paginacion.pagina === paginacion.total_paginas}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
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

      {/* Modal del Mapa */}
      <ModalMapa
        isOpen={mapaModal.abierto}
        onClose={cerrarMapaModal}
        lat={mapaModal.lat}
        lng={mapaModal.lng}
        titulo={mapaModal.titulo}
        alertaId={mapaModal.alertaId}
        tipo={mapaModal.tipo}
      />
    </div>
  );
};

export default AlertasEnProceso;