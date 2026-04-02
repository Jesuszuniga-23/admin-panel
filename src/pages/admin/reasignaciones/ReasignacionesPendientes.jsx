import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar,
  ChevronLeft, RefreshCw, Truck, XCircle, CheckCircle,
  Loader, AlertCircle, Phone, Shield, X, Bell, BellRing,
  Mail, MapPinned, Navigation, Copy, Eye, Filter, Search, Heart,
  ShieldCheck, Ambulance, Users, UserCheck, MessageSquare, Send
} from 'lucide-react';
import reasignacionService from '../../../services/admin/reasignacion.service';
import alertasService from '../../../services/admin/alertas.service';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeTipoAlerta, ModalMapa, BotonMapa } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';
import useAuthStore from '../../../store/authStore';

const ReasignacionesPendientes = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasFiltradas, setAlertasFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('');
  const [motivoReasignacion, setMotivoReasignacion] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  
  const abortControllerRef = useRef(null);
  const unidadesAbortControllerRef = useRef(null);
  const intervalRef = useRef(null);
  
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  const puedeReasignar = authService.puedeGestionarAlerta(tipoAlertaPermitido || '');
  
  const [filtroTipo, setFiltroTipo] = useState(tipoAlertaPermitido || 'todos');

  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });

  // ✅ CORRECCIÓN #1: Filtrar alertas cuando cambia filtroTipo
  useEffect(() => {
    if (tipoAlertaPermitido) {
      // Si hay filtro de seguridad, solo mostrar ese tipo
      setAlertasFiltradas(alertas.filter(a => a.tipo === tipoAlertaPermitido));
    } else if (filtroTipo === 'todos') {
      setAlertasFiltradas(alertas);
    } else {
      setAlertasFiltradas(alertas.filter(a => a.tipo === filtroTipo));
    }
  }, [alertas, filtroTipo, tipoAlertaPermitido]);

  const cargarPendientes = useCallback(async (silencioso = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en ReasignacionesPendientes');
    }
    
    abortControllerRef.current = new AbortController();
    
    if (!silencioso) setCargando(true);
    try {
      const params = { signal: abortControllerRef.current.signal };
      
      // ✅ APLICAR FILTRO DE SEGURIDAD PRIMERO
      if (tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
      } 
      // ✅ SOLO SI NO HAY FILTRO DE SEGURIDAD, aplicar filtro del usuario
      else if (filtroTipo !== 'todos') {
        params.tipo = filtroTipo;
      }
      
      const response = await reasignacionService.obtenerPendientes(params);
      const nuevosAlertas = response.data || [];
      setAlertas(nuevosAlertas);
      setUltimaActualizacion(new Date());

      if (mostrarModal && nuevosAlertas.length !== alertas.length) {
        toast('Nuevas alertas disponibles', {
          icon: <BellRing size={18} className="text-blue-500 animate-pulse" />,
          duration: 3000
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error:", error);
        if (!silencioso) toast.error('Error al cargar alertas pendientes');
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [tipoAlertaPermitido, filtroTipo, mostrarModal, alertas.length]);

  const handleVerUnidades = useCallback(async (alerta) => {
    if (!puedeReasignar) {
      toast.error('No tienes permisos para reasignar alertas');
      return;
    }
    
    if (unidadesAbortControllerRef.current) {
      unidadesAbortControllerRef.current.abort();
      console.log('🛑 Petición de unidades anterior cancelada');
    }
    
    unidadesAbortControllerRef.current = new AbortController();
    
    try {
      setAlertaSeleccionada(alerta);
      const response = await reasignacionService.obtenerUnidadesDisponibles(alerta.id, {
        signal: unidadesAbortControllerRef.current.signal
      });
      setUnidadesDisponibles(response.data || []);
      setMostrarModal(true);
      setUnidadSeleccionada('');
      setMotivoReasignacion('');
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error cargando unidades:", error);
        toast.error('Error al cargar unidades disponibles');
      }
    }
  }, [puedeReasignar]);

  useEffect(() => {
    cargarPendientes();
    
    intervalRef.current = setInterval(() => {
      console.log('Recargando alertas pendientes');
      cargarPendientes(true);
    }, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (unidadesAbortControllerRef.current) {
        unidadesAbortControllerRef.current.abort();
      }
    };
  }, [cargarPendientes]);

  useEffect(() => {
    if (filtroTipo && !tipoAlertaPermitido) {
      cargarPendientes();
    }
  }, [filtroTipo, cargarPendientes, tipoAlertaPermitido]);

  const handleReasignar = async () => {
    if (!unidadSeleccionada) {
      toast.error('Debes seleccionar una unidad');
      return;
    }

    setProcesando(true);
    try {
      await reasignacionService.reasignarAlerta(
        alertaSeleccionada.id,
        unidadSeleccionada,
        motivoReasignacion
      );

      toast.success('Alerta reasignada correctamente', {
        icon: <CheckCircle size={18} className="text-green-500" />
      });
      setMostrarModal(false);
      cargarPendientes();
    } catch (error) {
      console.error("Error reasignando:", error);
      toast.error(error.error || 'Error al reasignar alerta');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarManual = async () => {
    if (!puedeReasignar) {
      toast.error('No tienes permisos para cerrar alertas');
      return;
    }
    
    if (!motivoCierre.trim()) {
      toast.error('Debes proporcionar un motivo');
      return;
    }

    setProcesando(true);
    try {
      await alertasService.cerrarManual(alertaSeleccionada.id, motivoCierre);

      toast.success('Alerta cerrada manualmente', {
        icon: <CheckCircle size={18} className="text-green-500" />
      });
      setMostrarModalCierre(false);
      setAlertaSeleccionada(null);
      setMotivoCierre('');
      cargarPendientes();
    } catch (error) {
      console.error("Error cerrando alerta:", error);
      toast.error(error.error || 'Error al cerrar alerta');
    } finally {
      setProcesando(false);
    }
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

  const getTipoGradient = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-600 to-rose-700'
      : 'from-green-600 to-emerald-700';
  };

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (cargando && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-500">Cargando alertas pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-700 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200">
                <RefreshCw size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reasignaciones Pendientes</h1>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Tiempo real
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Solicitudes de reasignación de alertas</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Alertas activas sin asignar por más de 5 minutos
              {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Última actualización: {ultimaActualizacion.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => cargarPendientes()}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
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

        {/* Filtro por tipo de alerta */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Filtrar por tipo</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroTipo === 'todos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={!!tipoAlertaPermitido}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('panico')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filtroTipo === 'panico'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
              disabled={!!tipoAlertaPermitido && tipoAlertaPermitido !== 'panico'}
            >
              <AlertTriangle size={14} />
              Pánico
            </button>
            <button
              onClick={() => setFiltroTipo('medica')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filtroTipo === 'medica'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
              disabled={!!tipoAlertaPermitido && tipoAlertaPermitido !== 'medica'}
            >
              <Heart size={14} />
              Médica
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {alertasFiltradas.length} alertas encontradas
          </div>
        </div>

        {/* Tabla de Alertas */}
        {alertasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Todo en orden!</h3>
            <p className="text-gray-500">
              {filtroTipo !== 'todos' && !tipoAlertaPermitido
                ? `No hay alertas de tipo ${filtroTipo === 'panico' ? 'Pánico' : 'Médica'} pendientes de reasignación`
                : 'No hay alertas pendientes de reasignación'}
              {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIPO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIUDADANO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIEMPO ESPERA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UBICACIÓN</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">FECHA</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alertasFiltradas.map((alerta) => (
                    <tr 
                      key={alerta.id}
                      onClick={() => handleRowClick(alerta.id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <BadgeTipoAlerta tipo={alerta.tipo} size={12} />
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
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-500" />
                          <span className="text-sm font-semibold text-amber-600">
                            {alerta.minutos_espera} min
                          </span>
                        </div>
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
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatearFechaCorta(alerta.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {puedeReasignar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerUnidades(alerta);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-xs font-medium shadow-md"
                              title="Reasignar alerta"
                            >
                              <Truck size={14} />
                              <span>Reasignar</span>
                            </button>
                          )}
                          {puedeReasignar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlertaSeleccionada(alerta);
                                setMostrarModalCierre(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs font-medium"
                              title="Cerrar manualmente"
                            >
                              <XCircle size={14} />
                              <span>Cerrar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Modal de Reasignación MEJORADO */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
              {/* Header con gradiente */}
              <div className={`bg-gradient-to-r ${alertaSeleccionada?.tipo === 'panico' ? 'from-red-600 to-rose-700' : 'from-green-600 to-emerald-700'} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      {alertaSeleccionada?.tipo === 'panico' ? (
                        <AlertTriangle size={20} className="text-white" />
                      ) : (
                        <Heart size={20} className="text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Reasignar Alerta #{alertaSeleccionada?.id}
                      </h3>
                      <p className="text-xs text-white/80 mt-0.5">
                        {alertaSeleccionada?.tipo === 'panico' ? 'Alerta de Pánico' : 'Alerta Médica'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarModal(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {unidadesDisponibles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck size={32} className="text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">No hay unidades disponibles</h4>
                    <p className="text-sm text-gray-500">
                      {tipoAlertaPermitido === 'panico' 
                        ? 'No hay patrullas con personal disponible' 
                        : tipoAlertaPermitido === 'medica'
                          ? 'No hay ambulancias con personal disponible'
                          : 'No hay unidades con personal disponible'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Espera a que alguna unidad esté disponible
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Selección de unidad */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Truck size={16} className="text-blue-600" />
                          <span>Seleccionar unidad</span>
                        </div>
                      </label>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2">
                        {unidadesDisponibles.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => setUnidadSeleccionada(u.id)}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                              unidadSeleccionada === u.id
                                ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                u.tipo === 'patrulla' ? 'bg-blue-100' : 'bg-green-100'
                              }`}>
                                {u.tipo === 'patrulla' ? (
                                  <ShieldCheck size={20} className="text-blue-600" />
                                ) : (
                                  <Ambulance size={20} className="text-green-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{u.codigo}</p>
                                <p className="text-xs text-gray-500">
                                  {u.tipo === 'patrulla' ? 'Patrulla' : 'Ambulancia'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Users size={12} />
                              <span>{u.personal_disponible?.length || 0} disponible(s)</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {unidadSeleccionada && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle size={12} />
                          Unidad seleccionada
                        </p>
                      )}
                    </div>

                    {/* Motivo de reasignación */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-purple-600" />
                          <span>Motivo de reasignación</span>
                          <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                        </div>
                      </label>
                      <textarea
                        value={motivoReasignacion}
                        onChange={(e) => setMotivoReasignacion(e.target.value)}
                        placeholder="Ej: Unidad anterior no disponible, cambio de prioridad, unidad más cercana..."
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none transition-all"
                      />
                    </div>

                    {/* Información de la alerta */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Información de la alerta</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Espera: <span className="font-semibold">{alertaSeleccionada?.minutos_espera} min</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">
                            {alertaSeleccionada?.ciudadano?.nombre || 'Desconocido'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleReasignar}
                        disabled={procesando || !unidadSeleccionada}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200"
                      >
                        {procesando ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        {procesando ? 'Reasignando...' : 'Confirmar Reasignación'}
                      </button>
                      <button
                        onClick={() => setMostrarModal(false)}
                        disabled={procesando}
                        className="px-5 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cierre Manual */}
        {mostrarModalCierre && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
              {/* Header con gradiente */}
              <div className={`bg-gradient-to-r ${alertaSeleccionada?.tipo === 'panico' ? 'from-red-600 to-rose-700' : 'from-green-600 to-emerald-700'} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <XCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Cerrar Alerta #{alertaSeleccionada?.id}
                      </h3>
                      <p className="text-xs text-white/80 mt-0.5">
                        Cierre manual de alerta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarModalCierre(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">¿Estás seguro de cerrar esta alerta manualmente?</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Esta acción cerrará la alerta sin que haya sido atendida.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-purple-600" />
                      <span>Motivo del cierre</span>
                      <span className="text-red-500 text-xs">*</span>
                    </div>
                  </label>
                  <textarea
                    value={motivoCierre}
                    onChange={(e) => setMotivoCierre(e.target.value)}
                    placeholder="Ej: Alerta duplicada, falsa alarma, error del sistema..."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCerrarManual}
                    disabled={procesando || !motivoCierre.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-red-200"
                  >
                    {procesando ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {procesando ? 'Cerrando...' : 'Confirmar Cierre'}
                  </button>
                  <button
                    onClick={() => setMostrarModalCierre(false)}
                    disabled={procesando}
                    className="px-5 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default ReasignacionesPendientes;