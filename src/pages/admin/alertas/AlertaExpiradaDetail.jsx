import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar, ChevronLeft,
  Loader, AlertCircle, X, MapPinned,
  Phone, Mail, PhoneCall, Mail as MailIcon, UserCircle
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';

const AlertaExpiradaDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapaExpandido, setMapaExpandido] = useState(false);

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      setLoading(true);
      console.log("Cargando alerta expirada ID:", id);
      
      const response = await alertasService.obtenerExpiradas({ limite: 100 });
      const encontrada = (response.data || []).find(a => a.id === parseInt(id));
      
      if (encontrada) {
        console.log("Alerta expirada encontrada:", encontrada);
        setAlerta(encontrada);
      } else {
        setError('Alerta expirada no encontrada');
      }
      
    } catch (error) {
      console.error("Error cargando alerta:", error);
      setError('Error al cargar la alerta');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = () => 'bg-gray-100 text-gray-700 border-gray-200';
  const getEstadoIcon = () => <Clock size={16} />;

  const getTipoGradient = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-600 to-rose-700'
      : 'from-amber-600 to-orange-700';
  };

  const getBadgeColor = (tipo) => {
    return tipo === 'panico'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando información de la alerta...</p>
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
              <p className="text-sm text-gray-500 mt-1">Información de alerta no atendida #{alerta.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 font-medium ${getEstadoColor()}`}>
              {getEstadoIcon()}
              EXPIRADA
            </span>
          </div>
        </div>

        {/* Contenido principal - Grid de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información de la alerta */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {/* Cabecera con gradiente según tipo */}
              <div className={`bg-gradient-to-r ${getTipoGradient(alerta.tipo)} px-6 py-4`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {alerta.tipo === 'panico' ? (
                      <AlertTriangle size={28} className="text-white" />
                    ) : (
                      <AlertCircle size={28} className="text-white" />
                    )}
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
                      color="gray"
                    />
                  )}
                </div>

                {/* Información del ciudadano */}
                {alerta.ciudadano && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UserCircle size={20} className="text-blue-600" />
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

          {/* Columna derecha: Mapa y ubicación - SIN STICKY */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de ubicación con mapa */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MapPinned size={20} className="text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Ubicación del Evento</h3>
                  </div>
                  
                  {alerta.lat && alerta.lng && (
                    <button
                      onClick={() => setMapaExpandido(!mapaExpandido)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
                    >
                      {mapaExpandido ? (
                        <span className="text-white text-xs px-2">−</span>
                      ) : (
                        <span className="text-white text-xs px-2">+</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {alerta.lat && alerta.lng ? (
                  <>
                    {/* Coordenadas */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-blue-600" />
                          <span className="text-xs text-gray-500">Coordenadas:</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-gray-700">
                          {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                        </span>
                      </div>
                    </div>

                    {/* Mapa */}
                    <div className={`rounded-xl overflow-hidden border-2 border-gray-100 transition-all duration-300 ${
                      mapaExpandido ? 'h-[500px]' : 'h-[300px]'
                    }`}>
                      <MapaConDireccion
                        lat={alerta.lat}
                        lng={alerta.lng}
                        titulo={
                          <div className="flex items-center gap-1.5">
                            {alerta.tipo === 'panico' ? (
                              <>
                                <AlertTriangle size={14} className="text-red-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  Alerta de Pánico (Expirada)
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={14} className="text-amber-500" />
                                <span className="text-xs font-medium text-gray-700">
                                  Alerta Médica (Expirada)
                                </span>
                              </>
                            )}
                          </div>
                        }
                        alertaId={alerta.id}
                        altura={mapaExpandido ? "500px" : "300px"}
                      />
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
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Información de expiración</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">ID de alerta</span>
                  <span className="text-sm font-mono font-medium text-gray-800">#{alerta.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Tipo</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeColor(alerta.tipo)}`}>
                    {alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}
                  </span>
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
    </div>
  );
};

// Componente para tarjetas de información
const InfoCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    gray: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg">
          <Icon size={18} className={`text-${color === 'gray' ? 'gray' : 'blue'}-600`} />
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