// src/pages/admin/alertas/AlertaPanelDetail.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } useLocation } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, AlertTriangle,
  Shield, Lock, CheckCircle, XCircle,
  Clock, Truck, User, Calendar, MapPinned,
  UserCircle, PhoneCall, MailIcon, Loader,
  AlertCircle, Info, ChevronRight, Copy,
  Navigation, ExternalLink, Clipboard, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import { useOtp } from '../../../hooks/useOtp';
import IconoEntidad, { BadgeTipoAlerta, ModalMapa } from '../../../components/ui/IconoEntidad';
import BotonUbicacion from '../../../components/ui/BotonUbicacion';
import authService from '../../../services/auth.service';

// Función para ofuscar datos
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

// Normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' }
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

const AlertaPanelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiereOtp, setRequiereOtp] = useState(true);
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [copied, setCopied] = useState(false);
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
    setError(null);
    
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
          <div className={`bg-gradient-to-r ${getTipoGradient(response.data.tipo)}/10 border-l-4 border-${response.data.tipo === 'panico' ? 'red' : 'green'}-500 rounded-lg shadow-lg p-4`}>
            <div className="flex items-center gap-3">
              <Shield size={20} className={response.data.tipo === 'panico' ? 'text-red-600' : 'text-green-600'} />
              <p className="text-sm text-gray-700">Los datos sensibles están protegidos. Solicita un código para verlos.</p>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else if (response.data.ciudadano) {
        const alertaFormateada = {
          ...response.data,
          ciudadano: {
            ...response.data.ciudadano,
            nombre: formatearNombre(response.data.ciudadano.nombre)
          }
        };
        setAlerta(alertaFormateada);
      } else {
        setAlerta(response.data);
      }

    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando alerta:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Error al cargar la alerta';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const state = location.state;
    if (state?.datosCompletos) {
      setDatosCompletos(state.datosCompletos);
      setAlerta(state.datosCompletos);
      setLoading(false);
    } else {
      cargarAlerta();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, location.state, cargarAlerta]);

  const handleSolicitarOtp = async () => {
    const result = await solicitarOtp(id);
    if (result.success) {
      // El hook maneja el modal
    }
  };

  const handleVerificarOtp = async () => {
    const result = await verificarOtp(id, codigoOtp);
    if (result.success && result.data) {
      if (tipoAlertaPermitido && result.data.tipo !== tipoAlertaPermitido) {
        setError(`No tienes permiso para ver alertas de tipo ${result.data.tipo === 'panico' ? 'Pánico' : 'Médica'}`);
        setAlerta(null);
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
      setRequiereOtp(false);
      setCodigoOtp('');
      toast.success('Datos desbloqueados correctamente');
    }
  };

  const handleCopyCoordenadas = () => {
    if (alerta?.lat && alerta?.lng) {
      navigator.clipboard.writeText(`${alerta.lat},${alerta.lng}`);
      setCopied(true);
      toast.success('Coordenadas copiadas al portapapeles');
      setTimeout(() => setCopied(false), 2000);
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

  if (error || !alerta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 rounded-2xl shadow-lg p-12 text-center border border-red-200">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'No se encontró la alerta'}</p>
            <button
              onClick={() => navigate('/admin/alertas/activas')}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Volver a alertas activas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estadoConfig = getEstadoBadge(alerta.estado);
  const EstadoIcon = estadoConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/alertas/activas')}
              className="p-2 hover:bg-white rounded-xl transition-colors"
              title="Volver"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Detalle de Alerta</h1>
              <p className="text-sm text-gray-500 mt-1">Información completa de la alerta #{alerta.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <BadgeTipoAlerta tipo={alerta.tipo} size={14} />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.text}`}>
              <EstadoIcon size={12} />
              {estadoConfig.label}
            </span>
            {!requiereOtp && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
                <CheckCircle size={12} />
                Datos verificados
              </span>
            )}
            {requiereOtp && (
              <button
                onClick={handleSolicitarOtp}
                disabled={solicitando}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md disabled:opacity-50"
              >
                {solicitando ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <Lock size={14} />
                )}
                Solicitar código
              </button>
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
                      Alerta de {alerta.tipo === 'panico' ? 'Pánico' : 'Emergencia Médica'}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {alerta.tipo === 'panico' 
                        ? 'Activada por el ciudadano en situación de peligro'
                        : 'Solicitud de asistencia médica urgente'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                        ofuscado={requiereOtp}
                      />
                      
                      {alerta.ciudadano.telefono && (
                        <ContactCard
                          icon={Phone}
                          label="Teléfono"
                          value={alerta.ciudadano.telefono}
                          action={!requiereOtp ? () => window.open(`tel:${alerta.ciudadano.telefono}`) : null}
                          actionIcon={PhoneCall}
                          ofuscado={requiereOtp}
                        />
                      )}
                      
                      {alerta.ciudadano.email && (
                        <ContactCard
                          icon={Mail}
                          label="Email"
                          value={alerta.ciudadano.email}
                          action={!requiereOtp ? () => window.open(`mailto:${alerta.ciudadano.email}`) : null}
                          actionIcon={MailIcon}
                          ofuscado={requiereOtp}
                        />
                      )}
                    </div>
                  </div>
                )}

                {alerta.motivo_reasignacion && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
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
                  {alerta.lat && alerta.lng && (
                    <button
                      onClick={() => setMostrarMapaModal(true)}
                      className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Ampliar
                    </button>
                  )}
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-gray-700">
                            {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                          </span>
                          <button
                            onClick={handleCopyCoordenadas}
                            className="p-1 hover:bg-white rounded-md transition-colors"
                            title="Copiar coordenadas"
                          >
                            {copied ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Clipboard size={14} className="text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <BotonUbicacion
                      lat={alerta.lat}
                      lng={alerta.lng}
                      titulo={`Alerta #${alerta.id} - ${alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}`}
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
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Información adicional</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">ID de alerta</span>
                  <span className="text-sm font-mono font-medium text-gray-800">#{alerta.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Tipo</span>
                  <BadgeTipoAlerta tipo={alerta.tipo} size={12} />
                </div>
                {alerta.fecha_creacion && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Tiempo transcurrido</span>
                    <span className="text-sm font-medium text-gray-800">
                      {Math.floor((Date.now() - new Date(alerta.fecha_creacion)) / 60000)} minutos
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal OTP */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fadeInUp">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${getTipoGradient(alerta.tipo)} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
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

// Componente para tarjetas de información
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

// Componente para contactos con acción
const ContactCard = ({ icon: Icon, label, value, action, actionIcon: ActionIcon, ofuscado }) => (
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