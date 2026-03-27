// src/pages/admin/recuperaciones/RecuperacionesPendientes.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search,
  User, Calendar, Clock, CheckCircle, XCircle, MessageSquare,
  AlertCircle, Mail, Phone, RefreshCw, BellRing, Key
} from 'lucide-react';
import recuperacionService from '../../../services/admin/recuperacion.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import IconoEntidad, { BadgeIcono } from '../../../components/ui/IconoEntidad';

// Mapeo de estados a colores
const getEstadoConfig = (estado) => {
  switch(estado) {
    case 'pendiente':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock size={12} />, label: 'Pendiente' };
    case 'aprobada':
      return { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} />, label: 'Aprobada' };
    case 'rechazada':
      return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={12} />, label: 'Rechazada' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', icon: <AlertCircle size={12} />, label: estado || 'Desconocido' };
  }
};

const RecuperacionesPendientes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [accionLoading, setAccionLoading] = useState(false); // ✅ Estado para acciones

  // ✅ REF para AbortControllers
  const abortControllerRef = useRef(null);
  const intervalRef = useRef(null);

  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1,
    search: '',
    estado: 'pendiente'
  });

  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  const searchTerm = useDebounce(filtros.search, 500);

  // ✅ Función para cargar solicitudes con AbortController
  const cargarSolicitudes = useCallback(async (silencioso = false) => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en RecuperacionesPendientes');
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    if (!silencioso) setCargando(true);
    try {
      const filtrosActivos = {};

      if (filtros.search && filtros.search.trim() !== '') {
        filtrosActivos.search = filtros.search;
      }
      if (filtros.estado) {
        filtrosActivos.estado = filtros.estado;
      }

      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;
      filtrosActivos.signal = abortControllerRef.current.signal;

      console.log("Cargando recuperaciones con filtros:", filtrosActivos);
      const resultado = await recuperacionService.obtenerPendientes(filtrosActivos);

      setSolicitudes(resultado.data || []);
      setUltimaActualizacion(new Date());
      setPaginacion({
        total: resultado.total || resultado.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: resultado.total_paginas || 1
      });

      if (!silencioso && resultado.data?.length > solicitudes.length) {
        toast('Nuevas solicitudes recibidas', {
          icon: <BellRing size={18} className="text-blue-500 animate-pulse" />,
          duration: 3000
        });
      }
    } catch (error) {
      // ✅ Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error cargando recuperaciones:", error);
        if (!silencioso) toast.error('Error al cargar solicitudes');
        setSolicitudes([]);
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [filtros.search, filtros.estado, filtros.pagina, filtros.limite, solicitudes.length]);

  // ✅ Efecto con limpieza
  useEffect(() => {
    cargarSolicitudes();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      console.log('Recargando solicitudes (tiempo real)');
      cargarSolicitudes(true);
    }, 30000);

    return () => {
      // Limpiar intervalo
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Cancelar petición pendiente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente RecuperacionesPendientes desmontado - peticiones canceladas');
      }
    };
  }, [cargarSolicitudes]);

  const handleSearchChange = (e) => {
    setFiltros(prev => ({ ...prev, search: e.target.value, pagina: 1 }));
  };

  // ✅ Manejar aprobar con loading y cancelación
  const handleAprobar = useCallback(async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar esta solicitud?')) return;

    setAccionLoading(true);
    try {
      await recuperacionService.aprobarSolicitud(id);
      toast.success('Solicitud aprobada correctamente', {
        icon: <CheckCircle size={18} className="text-green-500" />
      });
      await cargarSolicitudes(); // Recargar después de aprobar
    } catch (error) {
      console.error('Error al aprobar:', error);
      toast.error('Error al aprobar la solicitud', {
        icon: <XCircle size={18} className="text-red-500" />
      });
    } finally {
      setAccionLoading(false);
    }
  }, [cargarSolicitudes]);

  // ✅ Manejar rechazar con loading y cancelación
  const handleRechazar = useCallback(async (id) => {
    const motivo = window.prompt('Motivo del rechazo:');
    if (!motivo) return;

    setAccionLoading(true);
    try {
      await recuperacionService.rechazarSolicitud(id, motivo);
      toast.success('Solicitud rechazada', {
        icon: <XCircle size={18} className="text-red-500" />
      });
      await cargarSolicitudes(); // Recargar después de rechazar
    } catch (error) {
      console.error('Error al rechazar:', error);
      toast.error('Error al rechazar la solicitud', {
        icon: <XCircle size={18} className="text-red-500" />
      });
    } finally {
      setAccionLoading(false);
    }
  }, [cargarSolicitudes]);

  const limpiarFiltros = () => {
    setFiltros({
      limite: 10,
      pagina: 1,
      search: '',
      estado: 'pendiente'
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-emerald-200">
              <Key size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Recuperaciones Pendientes</h1>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Tiempo real
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Solicitudes de recuperación de cuenta</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => cargarSolicitudes()}
            disabled={cargando}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${cargando ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Actualizar</span>
          </button>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-emerald-500" />
          <span className="text-sm font-medium text-gray-700">Filtros en tiempo real</span>
          <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full ml-2">
            Búsqueda instantánea
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filtros.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="">Todas</option>
          </select>

          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>

        {(filtros.search || filtros.estado !== 'pendiente') && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-emerald-600">Filtros aplicados en tiempo real - {paginacion.total} resultados</span>
          </div>
        )}
      </div>

      {/* Indicador de recarga automática */}
      <div className="flex justify-end mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin-slow" />
          Actualizando cada 30 segundos
        </span>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {cargando && solicitudes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay solicitudes {filtros.estado !== 'pendiente' ? `en estado "${filtros.estado}"` : 'pendientes'}</h3>
            <p className="text-sm text-gray-500">
              {filtros.search
                ? 'No se encontraron resultados con tu búsqueda'
                : 'Todas las solicitudes han sido procesadas'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {solicitudes.map((sol) => {
                const estadoConfig = getEstadoConfig(sol.estado);
                return (
                  <div key={sol.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Solicitud #{sol.id}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(sol.fecha_solicitud).toLocaleString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                        {estadoConfig.icon}
                        {estadoConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Información del solicitante */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <IconoEntidad entidad="CIUDADANO" size={16} />
                          Datos del Solicitante
                        </h4>
                        <div className="pl-6 space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="text-gray-400">Nombre:</span>{' '}
                            {sol.solicitante?.nombre || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            {sol.solicitante?.email || 'N/A'}
                          </p>
                          {sol.solicitante?.telefono && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              {sol.solicitante.telefono}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Motivo */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <MessageSquare size={16} className="text-gray-400" />
                          Motivo de la solicitud
                        </h4>
                        <div className="pl-6">
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {sol.motivo || 'Sin motivo especificado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Acciones (solo si está pendiente) */}
                    {sol.estado === 'pendiente' && (
                      <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                        <button
                          onClick={() => handleAprobar(sol.id)}
                          disabled={accionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {accionLoading ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(sol.id)}
                          disabled={accionLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {accionLoading ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Mostrando <span className="font-medium">{inicio}</span> a{' '}
                <span className="font-medium">{fin}</span> de{' '}
                <span className="font-medium">{paginacion.total}</span> solicitudes
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacion.pagina === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">
                  {paginacion.pagina} / {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecuperacionesPendientes;