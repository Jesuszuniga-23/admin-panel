import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar,
  ChevronLeft, RefreshCw, Truck, XCircle, CheckCircle,
  Loader, AlertCircle, Phone, Shield, X, Bell, BellRing,
  Mail, MapPinned, Navigation, Copy
} from 'lucide-react';
import reasignacionService from '../../../services/admin/reasignacion.service';
import alertasService from '../../../services/admin/alertas.service';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';

const ReasignacionesPendientes = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
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

  // Estado para el modal del mapa
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });

  // TIEMPO REAL - Cargar cada 30 segundos
  useEffect(() => {
    cargarPendientes();

    const intervalo = setInterval(() => {
      console.log('Recargando alertas pendientes');
      cargarPendientes(true);
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);

  const cargarPendientes = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const response = await reasignacionService.obtenerPendientes();
      setAlertas(response.data || []);
      setUltimaActualizacion(new Date());

      if (mostrarModal && response.data?.length !== alertas.length) {
        toast('Nuevas alertas disponibles', {
          icon: <BellRing size={18} className="text-blue-500 animate-pulse" />,
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error:", error);
      if (!silencioso) toast.error('Error al cargar alertas pendientes');
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  const handleVerUnidades = async (alerta) => {
    try {
      setAlertaSeleccionada(alerta);
      const response = await reasignacionService.obtenerUnidadesDisponibles(alerta.id);
      setUnidadesDisponibles(response.data || []);
      setMostrarModal(true);
      setUnidadSeleccionada('');
      setMotivoReasignacion('');
    } catch (error) {
      console.error("Error cargando unidades:", error);
      toast.error('Error al cargar unidades disponibles');
    }
  };

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

  // Función para abrir el modal del mapa
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

  const copiarCoordenadas = (e, lat, lng) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    toast.success('Coordenadas copiadas');
  };

  const getTipoColor = (tipo) => {
    return tipo === 'panico'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  const getTipoIcon = (tipo) => {
    return tipo === 'panico' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />;
  };

  if (cargando && alertas.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando alertas pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header - IGUAL */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200">
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
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => cargarPendientes()}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <RefreshCw size={14} className={`sm:w-4 sm:h-4 text-slate-500 ${cargando ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Actualizar</span>
          </button>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Dashboard</span>
          </button>
        </div>
      </div>

      {/* Indicador de recarga automática - IGUAL */}
      <div className="flex justify-end mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin-slow" />
          Actualizando cada 30 segundos
        </span>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Todo en orden!</h3>
          <p className="text-gray-500">No hay alertas pendientes de reasignación</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
            >
              {/* Barra superior con gradiente y tiempo */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-3 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {getTipoIcon(alerta.tipo)}
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTipoColor(alerta.tipo)}`}>
                      {alerta.tipo === 'panico' ? ' PÁNICO' : ' MÉDICA'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <Clock size={14} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-700">
                    {alerta.minutos_espera} min
                  </span>
                  <span className="text-xs text-gray-500">esperando</span>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Información de la alerta */}
                  <div className="flex-1 space-y-4">
                    {/* ID y tipo */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        Alerta #{alerta.id}
                      </h3>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        ID: {alerta.id}
                      </span>
                    </div>

                    {/* Grid de información del ciudadano */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Nombre */}
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-semibold">CIUDADANO</p>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {alerta.ciudadano?.nombre || 'Desconocido'}
                          </p>
                        </div>
                      </div>

                      {/* Teléfono */}
                      {alerta.ciudadano?.telefono && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Phone size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-green-600 font-semibold">TELÉFONO</p>
                            <a
                              href={`tel:${alerta.ciudadano.telefono}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium text-gray-800 hover:text-green-600 transition-colors"
                            >
                              {alerta.ciudadano.telefono}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Email (si existe) */}
                      {alerta.ciudadano?.email && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Mail size={16} className="text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-purple-600 font-semibold">EMAIL</p>
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {alerta.ciudadano.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sección de ubicación */}
                    {alerta.lat && alerta.lng ? (
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPinned size={18} className="text-blue-600" />
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              UBICACIÓN
                            </span>
                          </div>
                          <button
                            onClick={(e) => copiarCoordenadas(e, alerta.lat, alerta.lng)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors group"
                            title="Copiar coordenadas"
                          >
                            <Copy size={14} className="text-gray-400 group-hover:text-blue-600" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-mono text-gray-600">
                              {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                            </p>
                            <button
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium group"
                            >
                              <Navigation size={14} className="group-hover:scale-110 transition-transform" />
                              Ver ubicación en mapa
                            </button>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${alerta.lat},${alerta.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all"
                            title="Abrir en Google Maps"
                          >
                            <MapPin size={18} className="text-gray-600 hover:text-blue-600" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin size={18} />
                          <span className="text-sm">Ubicación no disponible</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones - IGUAL */}
                  <div className="flex flex-row lg:flex-col gap-3">
                    <button
                      onClick={() => handleVerUnidades(alerta)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl font-medium"
                    >
                      <Truck size={18} />
                      <span>Reasignar</span>
                    </button>
                    <button
                      onClick={() => {
                        setAlertaSeleccionada(alerta);
                        setMostrarModalCierre(true);
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-medium"
                    >
                      <XCircle size={18} />
                      <span>Cerrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Reasignación - IGUAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Reasignar Alerta #{alertaSeleccionada?.id}</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {unidadesDisponibles.length === 0 ? (
              <div className="text-center py-8">
                <Truck size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay unidades disponibles para reasignar</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar unidad
                  </label>
                  <select
                    value={unidadSeleccionada}
                    onChange={(e) => setUnidadSeleccionada(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Selecciona una unidad --</option>
                    {unidadesDisponibles.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.codigo} - {u.tipo} ({u.personal?.map(p => p.nombre).join(', ') || 'Sin personal'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de reasignación (opcional)
                  </label>
                  <textarea
                    value={motivoReasignacion}
                    onChange={(e) => setMotivoReasignacion(e.target.value)}
                    placeholder="Ej: Unidad anterior no disponible, cambio de prioridad..."
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleReasignar}
                    disabled={procesando || !unidadSeleccionada}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {procesando ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Truck size={18} />
                    )}
                    {procesando ? 'Reasignando...' : 'Confirmar Reasignación'}
                  </button>
                  <button
                    onClick={() => setMostrarModal(false)}
                    disabled={procesando}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cierre Manual - IGUAL */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Cerrar Alerta #{alertaSeleccionada?.id}</h3>
              <button
                onClick={() => setMostrarModalCierre(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de cerrar esta alerta manualmente?
            </p>

            <textarea
              value={motivoCierre}
              onChange={(e) => setMotivoCierre(e.target.value)}
              placeholder="Motivo del cierre..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={handleCerrarManual}
                disabled={procesando || !motivoCierre.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <XCircle size={18} />
                )}
                {procesando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
              <button
                onClick={() => setMostrarModalCierre(false)}
                disabled={procesando}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL MAPA - IGUAL */}
      {mapaModal.abierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setMapaModal({ abierto: false })}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  mapaModal.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Ubicación de la Alerta</h3>
                  <p className="text-xs text-gray-500">ID: #{mapaModal.alertaId} • {mapaModal.titulo}</p>
                </div>
              </div>
              <button
                onClick={() => setMapaModal({ abierto: false })}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

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

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setMapaModal({ abierto: false })}
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

export default ReasignacionesPendientes;