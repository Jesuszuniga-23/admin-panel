import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar,
  ChevronLeft, RefreshCw, Truck, XCircle, CheckCircle,
  Loader, AlertCircle, Phone, Shield, X
} from 'lucide-react';
import reasignacionService from '../../../services/admin/reasignacion.service';
import alertasService from '../../../services/admin/alertas.service';
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

  // =====================================================
  // TIEMPO REAL - Cargar cada 30 segundos
  // =====================================================
  useEffect(() => {
    cargarPendientes();
    
    // Configurar intervalo para recarga automática cada 30 segundos
    const intervalo = setInterval(() => {
      console.log('🔄 Recargando alertas pendientes (tiempo real)');
      cargarPendientes(true); // true = silencioso (sin mostrar loading)
    }, 30000); // 30 segundos

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalo);
  }, []);

  const cargarPendientes = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const response = await reasignacionService.obtenerPendientes();
      setAlertas(response.data || []);
      setUltimaActualizacion(new Date());
      
      // Si hay cambios y el modal está abierto, mostrar indicador sutil
      if (mostrarModal && response.data?.length !== alertas.length) {
        toast('🔄 Nuevas alertas disponibles', {
          icon: '📢',
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
      
      toast.success('✅ Alerta reasignada correctamente');
      setMostrarModal(false);
      cargarPendientes(); // Recargar inmediatamente después de reasignar
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
      
      toast.success('✅ Alerta cerrada manualmente');
      setMostrarModalCierre(false);
      setAlertaSeleccionada(null);
      setMotivoCierre('');
      cargarPendientes(); // Recargar inmediatamente después de cerrar
    } catch (error) {
      console.error("Error cerrando alerta:", error);
      toast.error(error.error || 'Error al cerrar alerta');
    } finally {
      setProcesando(false);
    }
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
      {/* Header con indicador de tiempo real */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Reasignaciones Pendientes</h1>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Tiempo real
            </span>
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
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Actualizar manualmente"
          >
            <RefreshCw size={18} className={`text-gray-500 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} />
            Volver
          </button>
        </div>
      </div>

      {/* Indicador de recarga automática */}
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
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border-l-4 border-amber-500"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Información de la alerta */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${getTipoColor(alerta.tipo)}`}>
                      {getTipoIcon(alerta.tipo)}
                      {alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      {alerta.minutos_espera} minutos esperando
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Alerta #{alerta.id}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {alerta.ciudadano?.nombre || 'Desconocido'}
                    </div>
                    {alerta.ciudadano?.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        {alerta.ciudadano.telefono}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerUnidades(alerta)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Truck size={18} />
                    Reasignar
                  </button>
                  <button
                    onClick={() => {
                      setAlertaSeleccionada(alerta);
                      setMostrarModalCierre(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={18} />
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Reasignación */}
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

      {/* Modal de Cierre Manual */}
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
    </div>
  );
};

export default ReasignacionesPendientes;