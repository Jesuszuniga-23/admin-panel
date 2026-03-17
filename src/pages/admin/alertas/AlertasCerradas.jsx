import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, MapPin, User, Phone, Clock, Eye,
  Filter, FileText, Image as ImageIcon,
  Truck, Download, X, AlertTriangle, Heart,
  Calendar, ChevronLeft, ChevronRight,
  CalendarClock, CalendarCheck, MapPinned
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';

// Función para normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
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

const AlertasCerradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
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
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [filtroFechaActivo, setFiltroFechaActivo] = useState(false);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerCerradas({ limite: 1000 });

      if (response.success) {
        const alertasFormateadas = (response.data || []).map(alerta => ({
          ...alerta,
          ciudadano: alerta.ciudadano ? {
            ...alerta.ciudadano,
            nombre: formatearNombre(alerta.ciudadano.nombre)
          } : null
        }));

        setAlertasOriginal(alertasFormateadas);
        aplicarFiltrosLocal(alertasFormateadas);
      } else {
        setAlertas([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    let datosFiltrados = datos;

    if (filtros.desde && filtros.hasta) {
      setFiltroFechaActivo(true);

      datosFiltrados = datos.filter(item => {
        const fechaCierre = new Date(item.fecha_cierre);

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

        return fechaCierre >= desde && fechaCierre <= hasta;
      });
    } else {
      setFiltroFechaActivo(false);
    }

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

  const handleFechaChange = (tipo, valor) => {
    setFiltros(prev => ({ ...prev, [tipo]: valor, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      desde: '',
      hasta: '',
      pagina: 1,
      limite: 10
    });
    setFiltroFechaActivo(false);
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros.desde, filtros.hasta, filtros.pagina]);

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

  const calcularTiempoAtencion = (creacion, cierre) => {
    if (!creacion || !cierre) return 'N/A';
    const minutos = Math.round((new Date(cierre) - new Date(creacion)) / 60000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-green-200">
              <CheckCircle size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Alertas Cerradas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Historial de alertas atendidas</p>
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
            <div className="p-1 sm:p-1.5 bg-blue-50 rounded-lg">
              <Filter size={14} className="sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Filtros por fecha</span>
            {filtroFechaActivo && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full ml-auto">
                {paginacion.total} {paginacion.total === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                value={filtros.desde}
                onChange={(e) => handleFechaChange('desde', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                value={filtros.hasta}
                onChange={(e) => handleFechaChange('hasta', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                onClick={limpiarFiltros}
                className="w-full px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        {loading ? (
          <div className="text-center py-12">
            <Loader />
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay alertas cerradas</h3>
            <p className="text-sm text-gray-400">
              {filtroFechaActivo
                ? `No se encontraron alertas entre ${formatearFechaCorta(filtros.desde)} y ${formatearFechaCorta(filtros.hasta)}`
                : 'Las alertas atendidas aparecerán aquí'}
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
            </div>

            {/* Tarjetas de alertas */}
            <div className="space-y-6">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
                >
                  {/* Cabecera con tipo e ID */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'}`}>
                        {getIconByTipo(alerta.tipo)}
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColorByTipo(alerta.tipo)}`}>
                          {alerta.tipo === 'panico' ? 'ALERTA DE PÁNICO' : 'ALERTA MÉDICA'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">ID</p>
                        <p className="text-sm font-semibold text-gray-700">#{alerta.id}</p>
                      </div>
                      {alerta.unidad && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Unidad</p>
                          <p className="text-sm font-semibold text-blue-600">{alerta.unidad.codigo}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Columna izquierda: Información del ciudadano */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={14} className="text-blue-600" />
                            INFORMACIÓN DEL CIUDADANO
                          </h3>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-semibold">
                                  {alerta.ciudadano?.nombre?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{alerta.ciudadano?.nombre || 'Desconocido'}</p>
                                <p className="text-xs text-gray-500">Ciudadano</p>
                              </div>
                            </div>

                            {alerta.ciudadano?.telefono && (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                                <Phone size={14} className="text-blue-500" />
                                <span className="text-sm text-gray-700">{alerta.ciudadano.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tiempo de atención */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
                          <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-amber-600" />
                            TIEMPO DE ATENCIÓN
                          </h3>

                          <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-amber-100">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-amber-700">
                                {calcularTiempoAtencion(alerta.fecha_asignacion, alerta.fecha_cierre)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">desde asignación hasta cierre</p>
                            </div>
                          </div>
                        </div>

                        {/* Fechas */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center gap-2">
                                <CalendarClock size={14} className="text-gray-400" />
                                Creación:
                              </span>
                              <span className="font-medium text-gray-700">{formatearFecha(alerta.fecha_creacion)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500 flex items-center gap-2">
                                <CalendarCheck size={14} className="text-gray-400" />
                                Cierre:
                              </span>
                              <span className="font-medium text-gray-700">{formatearFecha(alerta.fecha_cierre)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna derecha: Mapa */}
                      <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 h-full">
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MapPinned size={14} className="text-blue-600" />
                            UBICACIÓN DEL EVENTO
                          </h3>

                          <div className="rounded-lg overflow-hidden border border-gray-200">
                            {/* ✅ Mapa con petición bajo demanda */}
                            <MapaConDireccion
                              lat={alerta.lat}
                              lng={alerta.lng}
                              titulo={alerta.tipo === 'panico' ? '🔴 Alerta de Pánico' : '🟢 Alerta Médica'}
                              alertaId={alerta.id}
                              altura="320px"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporte (si existe) */}
                    {alerta.reporte && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                          <h3 className="text-xs font-semibold text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={14} className="text-purple-600" />
                            REPORTE DE ATENCIÓN
                          </h3>

                          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                            {alerta.reporte.descripcion}
                          </p>

                          {alerta.reporte.fotos?.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <ImageIcon size={12} />
                                {alerta.reporte.fotos.length} {alerta.reporte.fotos.length === 1 ? 'foto' : 'fotos'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {alerta.reporte.fotos.slice(0, 4).map((foto, idx) => (
                                  <div
                                    key={idx}
                                    className="relative cursor-pointer group"
                                    onClick={() => setImagenSeleccionada(foto.url)}
                                  >
                                    <img
                                      src={foto.url}
                                      alt=""
                                      className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm group-hover:border-purple-500 transition-all"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                                  </div>
                                ))}
                                {alerta.reporte.fotos.length > 4 && (
                                  <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center text-sm font-medium text-purple-700 border-2 border-white shadow-sm">
                                    +{alerta.reporte.fotos.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer con botón de acción */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-sm font-medium text-gray-600 group"
                    >
                      <Eye size={16} className="group-hover:text-blue-600" />
                      Ver detalle completo
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
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

                  <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                    Página {paginacion.pagina} de {paginacion.total_paginas}
                  </span>

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

      {/* Modal para ver imagen grande */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenSeleccionada(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <img
              src={imagenSeleccionada}
              alt=""
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
            />
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full p-3 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasCerradas;