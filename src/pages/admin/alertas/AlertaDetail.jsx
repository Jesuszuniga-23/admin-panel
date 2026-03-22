import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar, ChevronLeft,
  Loader, AlertCircle, CheckCircle, XCircle, FileText,
  Shield, Phone, Mail, MessageSquare, X, MapPinned,
  PhoneCall, Mail as MailIcon, UserCircle
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeTipoAlerta, ModalMapa } from '../../../components/ui/IconoEntidad';
import BotonUbicacion from '../../../components/ui/BotonUbicacion';

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

const AlertaDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [cerrando, setCerrando] = useState(false);
  
  // Estado para modal de mapa
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      setLoading(true);
      console.log("Cargando alerta ID:", id);
      
      const [expiradasRes, cerradasRes] = await Promise.allSettled([
        alertasService.obtenerExpiradas({ limite: 100 }),
        alertasService.obtenerCerradasManual({ limite: 100 })
      ]);

      const expiradas = expiradasRes.status === 'fulfilled' ? expiradasRes.value.data || [] : [];
      const cerradas = cerradasRes.status === 'fulfilled' ? cerradasRes.value.data || [] : [];
      
      const encontrada = [...expiradas, ...cerradas].find(a => a.id === parseInt(id));
      
      if (encontrada) {
        const alertaFormateada = {
          ...encontrada,
          ciudadano: encontrada.ciudadano ? {
            ...encontrada.ciudadano,
            nombre: formatearNombre(encontrada.ciudadano.nombre)
          } : null
        };
        console.log("Alerta encontrada:", alertaFormateada);
        setAlerta(alertaFormateada);
      } else {
        setError('Alerta no encontrada');
      }
      
    } catch (error) {
      console.error("Error cargando alerta:", error);
      setError('Error al cargar la alerta');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarManual = async () => {
    if (!motivoCierre.trim()) {
      toast.error('Debes proporcionar un motivo para el cierre');
      return;
    }

    setCerrando(true);
    try {
      const response = await alertasService.cerrarManual(id, motivoCierre);
      
      if (response.success) {
        toast.success('Alerta cerrada manualmente');
        setMostrarModalCierre(false);
        setMotivoCierre('');
        
        setAlerta(prev => ({
          ...prev,
          estado: 'cerrada',
          cerrada_manualmente: true,
          motivo_cierre_manual: motivoCierre
        }));
        
        setTimeout(() => cargarAlerta(), 2000);
      }
    } catch (error) {
      console.error("Error cerrando alerta:", error);
      toast.error(error.error || 'Error al cerrar la alerta');
    } finally {
      setCerrando(false);
    }
  };

  const abrirMapaModal = () => {
    if (!alerta?.lat || !alerta?.lng) return;
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

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activa': return 'bg-red-100 text-red-700 border-red-200';
      case 'expirada': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cerrada': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'activa': return <AlertTriangle size={16} />;
      case 'expirada': return <Clock size={16} />;
      case 'cerrada': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
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
              Volver a alertas
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
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Detalle de Alerta</h1>
              <p className="text-sm text-gray-500 mt-1">Información completa de la alerta #{alerta.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium ${getEstadoColor(alerta.estado)}`}>
              {getEstadoIcon(alerta.estado)}
              {alerta.estado === 'activa' ? 'ACTIVA' : 
               alerta.estado === 'expirada' ? 'EXPIRADA' : 'CERRADA'}
            </span>
            
            {alerta.estado !== 'cerrada' && alerta.estado !== 'cancelada' && (
              <button
                onClick={() => setMostrarModalCierre(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
              >
                <XCircle size={18} />
                <span className="hidden sm:inline">Cerrar Manualmente</span>
                <span className="sm:hidden">Cerrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido principal - Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información de la alerta (2 columnas en lg) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta principal de la alerta */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {/* Cabecera con gradiente según tipo */}
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
                        ? 'Activada por el ciudadano en situación de riesgo'
                        : 'Solicitud de asistencia médica de emergencia'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Grid de información temporal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <InfoCard
                    icon={Calendar}
                    label="Fecha de creación"
                    value={new Date(alerta.fecha_creacion).toLocaleString('es-MX')}
                    color="blue"
                  />
                  
                  {alerta.fecha_expiracion && (
                    <InfoCard
                      icon={Clock}
                      label="Fecha de expiración"
                      value={new Date(alerta.fecha_expiracion).toLocaleString('es-MX')}
                      color="amber"
                    />
                  )}
                  
                  {alerta.fecha_cierre && (
                    <InfoCard
                      icon={CheckCircle}
                      label="Fecha de cierre"
                      value={new Date(alerta.fecha_cierre).toLocaleString('es-MX')}
                      color="green"
                    />
                  )}
                </div>

                {/* Información del ciudadano */}
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

                {/* Motivo de cierre manual */}
                {alerta.cerrada_manualmente && (
                  <div className="border-t border-gray-100 pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MessageSquare size={20} className="text-amber-600" />
                      Motivo de cierre manual
                    </h3>
                    <div className="p-5 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="text-gray-700 leading-relaxed">
                        {alerta.motivo_cierre_manual || 'Sin motivo especificado'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Mapa y ubicación */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de ubicación con botón profesional */}
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
                    {/* Coordenadas */}
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

                    {/* Botón de ubicación profesional */}
                    <BotonUbicacion
                      lat={alerta.lat}
                      lng={alerta.lng}
                      titulo={alerta.tipo === 'panico' ? 'Alerta de Pánico' : 'Alerta Médica'}
                      alertaId={alerta.id}
                      altura="280px"
                    />

                    {/* Botón para abrir en Google Maps */}
                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps?q=${alerta.lat},${alerta.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-sm text-gray-600"
                      >
                        <MapPin size={16} />
                        Abrir en Google Maps
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
                    <MapPin size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">Coordenadas no disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
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
                {alerta.ciudadano && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-500">Ciudadano ID</span>
                    <span className="text-sm font-mono text-gray-800">#{alerta.ciudadano.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de cierre */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Cerrar Alerta Manualmente</h3>
              <button
                onClick={() => setMostrarModalCierre(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Estás a punto de cerrar la alerta <span className="font-semibold">#{alerta.id}</span>.
              Por favor, proporciona un motivo para el cierre:
            </p>

            <textarea
              value={motivoCierre}
              onChange={(e) => setMotivoCierre(e.target.value)}
              placeholder="Ej: Falsa alarma, ya no es relevante, etc."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              disabled={cerrando}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCerrarManual}
                disabled={cerrando}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cerrando ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
              <button
                onClick={() => setMostrarModalCierre(false)}
                disabled={cerrando}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
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
  );
};

// Componente para tarjetas de información
const InfoCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    green: 'bg-green-50 border-green-100'
  };

  const iconColors = {
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    green: 'text-green-600'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-white rounded-lg`}>
          <Icon size={18} className={iconColors[color]} />
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
        title={`Llamar a ${value}`}
      >
        <ActionIcon size={16} className="text-blue-600" />
      </button>
    )}
  </div>
);

export default AlertaDetail;