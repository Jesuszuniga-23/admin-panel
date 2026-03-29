// src/pages/admin/alertas/AlertaPanelDetail.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, AlertTriangle,
  Shield, Lock, CheckCircle, XCircle,
  Clock, Truck, User, Calendar, MapPinned,
  UserCircle, PhoneCall, MailIcon, Loader,
  AlertCircle, Info, ChevronRight, Copy,
  Navigation, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import MapaOSM from '../../../components/maps/MapaOSM';
import { useOtp } from '../../../hooks/useOtp';
import IconoEntidad, { BadgeTipoAlerta, ModalMapa } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';

// Función para ofuscar datos (mantener)
const ofuscarNombre = (nombre) => {
  if (!nombre) return '***';
  if (nombre.length <= 2) return nombre[0] + '*';
  return nombre[0] + '*'.repeat(Math.min(nombre.length - 2, 4)) + nombre.slice(-1);
};

const ofuscarTelefono = (telefono) => {
  if (!telefono) return '***';
  if (telefono.length <= 4) return '*'.repeat(telefono.length);
  return telefono.slice(0, 3) + '***' + telefono.slice(-2);
};

const ofuscarEmail = (email) => {
  if (!email) return '***';
  const [local, dominio] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${dominio}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local.slice(-1)}@${dominio}`;
};

// Formatear fecha
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

const AlertaPanelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiereOtp, setRequiereOtp] = useState(true);
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [mostrarMapaModal, setMostrarMapaModal] = useState(false);

  const abortControllerRef = useRef(null);
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();

  const {
    solicitando,
    verificando,
    showModal,
    otpEmail,
    otpExpiracion,
    codigoOtp,
    setCodigoOtp,
    solicitarOtp,
    verificarOtp,
    cerrarModal
  } = useOtp();

  const cargarAlerta = useCallback(async () => {
    if (!id) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    
    try {
      const response = await alertasPanelService.obtenerDetalle(id, {
        signal: abortControllerRef.current.signal
      });

      setDatosCompletos(response.data);
      setRequiereOtp(response.requiere_otp);

      if (response.requiere_otp && response.data.ciudadano) {
        const dataOfuscada = {
          ...response.data,
          ciudadano: {
            ...response.data.ciudadano,
            nombre: ofuscarNombre(response.data.ciudadano.nombre),
            telefono: ofuscarTelefono(response.data.ciudadano.telefono),
            email: ofuscarEmail(response.data.ciudadano.email)
          }
        };
        setAlerta(dataOfuscada);
        toast.custom(
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-blue-600" />
              <p className="text-sm text-blue-800">Los datos sensibles están protegidos. Solicita un código para verlos.</p>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        setAlerta(response.data);
      }

    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando alerta:', error);
        toast.error('Error al cargar los detalles de la alerta');
        navigate('/admin/alertas/activas');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    cargarAlerta();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cargarAlerta]);

  const handleSolicitarOtp = async () => {
    const result = await solicitarOtp(id);
    if (result.success) {
      // El hook maneja el modal
    }
  };

  const handleVerificarOtp = async () => {
    const result = await verificarOtp(id, codigoOtp);
    if (result.success) {
      setAlerta({
        ...datosCompletos,
        requiere_otp: false
      });
      setRequiereOtp(false);
      setCodigoOtp('');
      toast.success('Datos desbloqueados correctamente');
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      confirmando: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Confirmando' },
      activa: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Activa' },
      asignada: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck, label: 'Asignada' },
      atendiendo: { bg: 'bg-purple-100', text: 'text-purple-800', icon: User, label: 'Atendiendo' },
      cerrada: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Cerrada' },
      expirada: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: 'Expirada' }
    };
    return estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Info, label: estado };
  };

  const getTipoGradient = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-600 to-rose-700'
      : 'from-green-600 to-emerald-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Cargando información de la alerta...</p>
        </div>
      </div>
    );
  }

  if (!alerta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <AlertTriangle size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Alerta no encontrada</h3>
          <p className="text-gray-500 mb-6">La alerta que buscas no existe o no tienes permisos para verla.</p>
          <button
            onClick={() => navigate('/admin/alertas/activas')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Volver a alertas activas
          </button>
        </div>
      </div>
    );
  }

  const estadoConfig = getEstadoBadge(alerta.estado);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header con navegación */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-r ${getTipoGradient(alerta.tipo)} shadow-lg`}>
                <IconoEntidad 
                  entidad={alerta.tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} 
                  size={28}
                  color="text-white"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    Alerta #{alerta.id}
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
                    <EstadoIcon size={12} />
                    {estadoConfig.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <span>Registrada el {formatearFecha(alerta.fecha_creacion)}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>Tipo: {alerta.tipo === 'panico' ? '🚨 Emergencia de Pánico' : '🚑 Emergencia Médica'}</span>
                </p>
              </div>
            </div>

            {requiereOtp && (
              <button
                onClick={handleSolicitarOtp}
                disabled={solicitando}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 font-medium"
              >
                {solicitando ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                Solicitar código para ver datos
              </button>
            )}
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mapa */}
            {alerta.lat && alerta.lng && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPinned size={18} className="text-red-500" />
                      <h2 className="font-semibold text-gray-800">Ubicación del incidente</h2>
                    </div>
                    <button
                      onClick={() => setMostrarMapaModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      Ampliar mapa
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="h-64 rounded-xl overflow-hidden shadow-inner">
                    <MapaOSM
                      lat={alerta.lat}
                      lng={alerta.lng}
                      zoom={15}
                      markerTitle={`Alerta ${alerta.tipo}`}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                    <span className="font-mono">
                      📍 {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${alerta.lat},${alerta.lng}`);
                        toast.success('Coordenadas copiadas');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Copy size={12} />
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles del evento */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="font-semibold text-gray-800">Detalles del evento</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard
                    icon={Calendar}
                    label="Fecha de creación"
                    value={formatearFecha(alerta.fecha_creacion)}
                    color="blue"
                  />
                  
                  {alerta.fecha_asignacion && (
                    <InfoCard
                      icon={Truck}
                      label="Fecha de asignación"
                      value={formatearFecha(alerta.fecha_asignacion)}
                      color="purple"
                    />
                  )}
                  
                  {alerta.fecha_cierre && (
                    <InfoCard
                      icon={CheckCircle}
                      label="Fecha de cierre"
                      value={formatearFecha(alerta.fecha_cierre)}
                      color="green"
                    />
                  )}
                  
                  {alerta.unidad && (
                    <InfoCard
                      icon={Truck}
                      label="Unidad asignada"
                      value={`${alerta.unidad.codigo} (${alerta.unidad.tipo === 'policia' ? 'Policía' : 'Ambulancia'})`}
                      color="indigo"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Información del ciudadano */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <UserCircle size={18} className="text-purple-600" />
                  <h2 className="font-semibold text-gray-800">Información del ciudadano</h2>
                </div>
                {requiereOtp && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Lock size={10} />
                    Datos protegidos
                  </p>
                )}
              </div>

              <div className="p-5">
                {alerta.ciudadano ? (
                  <div className="space-y-4">
                    <ContactInfo
                      icon={User}
                      label="Nombre completo"
                      value={alerta.ciudadano.nombre}
                      ofuscado={requiereOtp}
                    />
                    
                    {alerta.ciudadano.telefono && (
                      <ContactInfo
                        icon={Phone}
                        label="Teléfono"
                        value={alerta.ciudadano.telefono}
                        action={() => !requiereOtp && window.open(`tel:${alerta.ciudadano.telefono}`)}
                        actionIcon={PhoneCall}
                        ofuscado={requiereOtp}
                      />
                    )}
                    
                    {alerta.ciudadano.email && (
                      <ContactInfo
                        icon={Mail}
                        label="Correo electrónico"
                        value={alerta.ciudadano.email}
                        action={() => !requiereOtp && window.open(`mailto:${alerta.ciudadano.email}`)}
                        actionIcon={MailIcon}
                        ofuscado={requiereOtp}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No hay información del ciudadano disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estado adicional */}
            {alerta.motivo_reasignacion && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Motivo de reasignación</p>
                    <p className="text-sm text-amber-800 mt-1">{alerta.motivo_reasignacion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal OTP */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeInUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Verificación de seguridad</h3>
              <p className="text-sm text-gray-500 mt-2">
                Ingresa el código de 6 dígitos enviado a:
              </p>
              <p className="font-medium text-gray-700 mt-1">{otpEmail}</p>
              {otpExpiracion && (
                <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <Clock size={12} />
                  Válido hasta: {new Date(otpExpiracion).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cerrarModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerificarOtp}
                disabled={verificando || codigoOtp.length !== 6}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all font-medium shadow-md"
              >
                {verificando ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Verificar
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleSolicitarOtp}
                disabled={solicitando}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                ¿No recibiste el código? Reenviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mapa Expandido */}
      <ModalMapa
        isOpen={mostrarMapaModal}
        onClose={() => setMostrarMapaModal(false)}
        lat={alerta.lat}
        lng={alerta.lng}
        titulo={`Alerta #${alerta.id} - ${alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}`}
        alertaId={alerta.id}
        tipo={alerta.tipo}
      />
    </div>
  );
};

// Componente de tarjeta de información
const InfoCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    green: { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' }
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${style.bg} border ${style.border}`}>
      <div className={`p-2 rounded-lg ${style.iconBg}`}>
        <Icon size={16} className={style.iconColor} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
};

// Componente de información de contacto
const ContactInfo = ({ icon: Icon, label, value, action, actionIcon: ActionIcon, ofuscado }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl border ${ofuscado ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors'}`}>
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${ofuscado ? 'text-gray-400' : 'text-gray-800'}`}>
          {value}
          {ofuscado && <Lock size={10} className="inline ml-1 text-amber-500" />}
        </p>
      </div>
    </div>
    {action && !ofuscado && ActionIcon && (
      <button
        onClick={action}
        className="p-2 hover:bg-white rounded-lg transition-colors"
        title={`Contactar por ${label.toLowerCase()}`}
      >
        <ActionIcon size={16} className="text-blue-600" />
      </button>
    )}
  </div>
);

export default AlertaPanelDetail;