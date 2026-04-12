// src/pages/admin/alertas/AlertaExpiradaDetail.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar, ChevronLeft,
  Loader, AlertCircle, X, MapPinned,
  Phone, Mail, PhoneCall, Mail as MailIcon, UserCircle, Lock, Shield, CheckCircle
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeTipoAlerta, ModalMapa } from '../../../components/ui/IconoEntidad';
import BotonUbicacion from '../../../components/ui/BotonUbicacion';
import authService from '../../../services/auth.service';
import { useOtp } from '../../../hooks/useOtp';

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

// ✅ CORRECCIÓN #2: Función para formatear fecha con manejo de errores
const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  try {
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return 'Fecha inválida';
    return f.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return 'N/A';
  }
};

const AlertaExpiradaDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [mostrarModalOtp, setMostrarModalOtp] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState('');
  
  // REF para AbortController
  const abortControllerRef = useRef(null);
  
  // Obtener tipo de alerta permitido según rol (para validar acceso)
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  // Hook OTP
  const {
    solicitando,
    verificando,
    solicitarOtp,
    verificarOtp,
    cerrarModal: cerrarModalOtpHook,
    showModal: showModalHook,
    otpEmail,
    otpExpiracion
  } = useOtp();
  
  // Estado para modal de mapa expandido
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });

  // ✅ CORRECCIÓN #1: Función cargarAlerta con validación de permisos
  const cargarAlerta = useCallback(async () => {
    if (!id) return;
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en AlertaExpiradaDetail');
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Cargando alerta expirada ID:", id);
      
      const response = await alertasPanelService.obtenerDetalle(id, {
        signal: abortControllerRef.current.signal
      });
      console.log("Respuesta del backend:", response);
      
      if (response.success && response.data) {
        // ✅ VERIFICAR PERMISO DEL USUARIO
        if (tipoAlertaPermitido && response.data.tipo !== tipoAlertaPermitido) {
          setError(`No tienes permiso para ver alertas de tipo ${response.data.tipo === 'panico' ? 'Pánico' : 'Médica'}`);
          setLoading(false);
          return;
        }
        
        setDatosCompletos(response.data);
        
        if (response.requiere_otp) {
          setMostrarModalOtp(true);
        } else {
          const alertaFormateada = {
            ...response.data,
            ciudadano: response.data.ciudadano ? {
              ...response.data.ciudadano,
              nombre: formatearNombre(response.data.ciudadano.nombre)
            } : null
          };
          setAlerta(alertaFormateada);
        }
      } else {
        setError('Alerta expirada no encontrada');
        toast.error('Alerta no encontrada');
      }
    } catch (error) {
      // ✅ Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error cargando alerta:", error);
        const errorMsg = error.response?.data?.error || error.message || 'Error al cargar la alerta';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [id, tipoAlertaPermitido]);

  // Efecto con limpieza y manejo de datos desde navegación
  useEffect(() => {
    const state = location.state;
    if (state?.datosCompletos) {
      console.log('📦 Datos completos recibidos desde estado de navegación');
      const data = state.datosCompletos;
      // ✅ VERIFICAR PERMISO DEL USUARIO para datos de estado
      if (tipoAlertaPermitido && data.tipo !== tipoAlertaPermitido) {
        setError(`No tienes permiso para ver alertas de tipo ${data.tipo === 'panico' ? 'Pánico' : 'Médica'}`);
        setLoading(false);
      } else {
        setDatosCompletos(data);
        setAlerta(data);
        setLoading(false);
      }
    } else {
      cargarAlerta();
    }
    
    // ✅ LIMPIAR al desmontar el componente
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente AlertaExpiradaDetail desmontado - petición cancelada');
      }
    };
  }, [id, location.state, cargarAlerta, tipoAlertaPermitido]);

  const handleSolicitarOtp = async () => {
    if (!id) return;
    const result = await solicitarOtp(id);
    if (result.success) {
      setMostrarModalOtp(false);
    }
  };

  const handleVerificarOtpYVerDetalle = async () => {
    if (!id || !codigoOtp) return;
    const result = await verificarOtp(id, codigoOtp);
    if (result.success && result.data) {
      // Verificar si el rol tiene acceso a este tipo de alerta
      if (tipoAlertaPermitido && result.data.tipo !== tipoAlertaPermitido) {
        setError(`No tienes permiso para ver alertas de tipo ${result.data.tipo === 'panico' ? 'Pánico' : 'Médica'}`);
        setAlerta(null);
        setLoading(false);
        return;
      }
      
      const alertaFormateada = {
        ...result.data,
        ciudadano: result.data.ciudadano ? {
          ...result.data.ciudadano,
          nombre: formatearNombre(result.data.ciudadano.nombre)
        } : null
      };
      setAlerta(alertaFormateada);
      setCodigoOtp('');
    }
  };

  const abrirMapaModal = () => {
    if (!alerta?.lat || !alerta?.lng) return;
    setMapaModal({
      abierto: true,
      lat: alerta.lat,
      lng: alerta.lng,
      titulo: alerta.tipo === 'panico' ? 'Alerta de Pánico (Expirada)' : 'Alerta Médica (Expirada)',
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

  const getTipoGradient = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-600 to-rose-700'
      : 'from-green-600 to-emerald-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-500">Cargando información de la alerta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !alerta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 rounded-2xl shadow-lg p-12 text-center border border-red-200">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'No se encontró la alerta'}</p>
            <button
              onClick={() => navigate('/admin/alertas/expiradas')}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Volver a alertas expiradas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/alertas/expiradas')}
              className="p-2 hover:bg-white rounded-xl transition-colors"
              title="Volver"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alerta Expirada</h1>
              <p className="text-sm text-gray-500 mt-1">Información de alerta no atendida</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BadgeTipoAlerta tipo={alerta.tipo} size={14} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <Clock size={12} />
              Expirada
            </span>
            {!alerta.requiere_otp && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                <CheckCircle size={12} />
                Datos verificados
              </span>
            )}
          </div>
        </div>

        {/* Contenido principal - Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información de la alerta */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className={`bg-gradient-to-r ${getTipoGradient(alerta.tipo)} px-6 py-4`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <IconoEntidad 
                      entidad={alerta.tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} 
                      size={28}
                      color="text-white"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Alerta de {alerta.tipo === 'panico' ? 'Pánico' : 'Emergencia Médica'} - NO ATENDIDA
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {alerta.tipo === 'panico' 
                        ? 'Activada por el ciudadano pero no fue atendida a tiempo'
                        : 'Solicitud de asistencia médica que expiró sin ser atendida'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* ✅ CORRECCIÓN #2: Usar formatearFecha para fechas */}
                  <InfoCard
                    icon={Calendar}
                    label="Fecha de creación"
                    value={formatearFecha(alerta.fecha_creacion)}
                    color="blue"
                  />
                  
                  {alerta.fecha_expiracion && (
                    <InfoCard
                      icon={Clock}
                      label="Fecha de expiración"
                      value={formatearFecha(alerta.fecha_expiracion)}
                      color="gray"
                    />
                  )}
                </div>

                {alerta.ciudadano && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UserCircle size={20} className="text-purple-600" />
                      Información del Ciudadano
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ContactCard
                        icon={User}
                        label="Nombre completo"
                        value={alerta.ciudadano.nombre || 'No disponible'}
                      />
                      
                      {alerta.ciudadano.telefono && (
                        <ContactCard
                          icon={Phone}
                          label="Teléfono"
                          value={alerta.ciudadano.telefono}
                          action={() => window.open(`tel:${alerta.ciudadano.telefono}`)}
                          actionIcon={PhoneCall}
                        />
                      )}
                      
                      {alerta.ciudadano.email && (
                        <ContactCard
                          icon={Mail}
                          label="Email"
                          value={alerta.ciudadano.email}
                          action={() => window.open(`mailto:${alerta.ciudadano.email}`)}
                          actionIcon={MailIcon}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Mapa y ubicación */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className={`bg-gradient-to-r ${getTipoGradient(alerta.tipo)} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MapPinned size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Ubicación del Evento</h3>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {alerta.lat && alerta.lng ? (
                  <>
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-red-500" />
                          <span className="text-xs text-gray-500">Coordenadas:</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-700">
                          {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                        </span>
                      </div>
                    </div>

                    <BotonUbicacion
                      lat={alerta.lat}
                      lng={alerta.lng}
                      titulo={alerta.tipo === 'panico' ? 'Alerta de Pánico (Expirada)' : 'Alerta Médica (Expirada)'}
                      alertaId={alerta.id}
                      altura="280px"
                    />
                  </>
                ) : (
                  <div className="h-[200px] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <MapPin size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">Coordenadas no disponibles</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Información de expiración</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Tipo</span>
                  <BadgeTipoAlerta tipo={alerta.tipo} size={12} />
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-gray-500">Minutos sin atender</span>
                  <span className="text-sm font-medium text-gray-800">
                    {Math.round((new Date(alerta.fecha_expiracion) - new Date(alerta.fecha_creacion)) / 60000)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
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

      {/* MODAL DE SOLICITUD DE OTP */}
      {mostrarModalOtp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <Shield className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                Verificación de seguridad
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Para ver los datos completos de esta alerta, necesitas solicitar un código de verificación.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                El código será enviado a tu correo electrónico.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setMostrarModalOtp(false);
                  navigate('/admin/alertas/expiradas');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarOtp}
                disabled={solicitando}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {solicitando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                Solicitar código
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INGRESO DE OTP */}
      {showModalHook && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <Shield className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                Ingresa el código de verificación
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Se ha enviado un código a:
              </p>
              <p className="font-medium text-gray-700">{otpEmail}</p>
              {otpExpiracion && (
                <p className="text-xs text-gray-400 mt-1">
                  Válido hasta: {new Date(otpExpiracion).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cerrarModalOtpHook}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerificarOtpYVerDetalle}
                disabled={verificando || codigoOtp.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {verificando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Verificar y ver detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para tarjetas de información
const InfoCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconColor: 'text-blue-600'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      iconColor: 'text-gray-600'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg">
          <Icon size={18} className={style.iconColor} />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-medium text-gray-800 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Componente para contactos con acción
const ContactCard = ({ icon: Icon, label, value, action, actionIcon: ActionIcon }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
    {action && ActionIcon && (
      <button
        onClick={action}
        className="p-2 hover:bg-white rounded-lg transition-colors"
      >
        <ActionIcon size={16} className="text-blue-600" />
      </button>
    )}
  </div>
);

export default AlertaExpiradaDetail;