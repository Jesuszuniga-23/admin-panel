import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader, AlertCircle, MapPin, User, Phone,
  Mail, Clock, Truck, FileText, Image as ImageIcon,
  Calendar, Download, X, CheckCircle, AlertTriangle, Heart,
  MapPinned, PhoneCall, Mail as MailIcon, UserCircle,
  Maximize2, Minimize2, Navigation
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';

const AlertaPanelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [mapaExpandido, setMapaExpandido] = useState(false);

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      setLoading(true);
      console.log(`Cargando alerta ID: ${id} desde panel`);
      const response = await alertasPanelService.obtenerDetalle(id);
      
      if (response.success && response.data) {
        console.log('Alerta cargada:', response.data);
        setAlerta(response.data);
      } else {
        setError('Alerta no encontrada');
      }
    } catch (error) {
      console.error('Error cargando alerta:', error);
      setError('Error al cargar la alerta');
    } finally {
      setLoading(false);
    }
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

  const getTipoGradient = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-600 to-rose-700'
      : 'from-green-600 to-emerald-700';
  };

  const calcularTiempoAtencion = () => {
    if (!alerta?.fecha_asignacion || !alerta?.fecha_cierre) return null;
    const minutos = Math.round((new Date(alerta.fecha_cierre) - new Date(alerta.fecha_asignacion)) / 60000);
    if (minutos < 60) return `${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-500">Cargando información de la alerta...</p>
        </div>
      </div>
    );
  }

  if (error || !alerta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 rounded-2xl shadow-lg p-12 text-center border border-red-200">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-6">{error || 'Alerta no encontrada'}</p>
            <button
              onClick={() => navigate('/admin/alertas/cerradas')}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Volver a alertas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tiempoAtencion = calcularTiempoAtencion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header con navegación */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-xl transition-colors"
              title="Volver"
            >
              <ArrowLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className={`p-2 rounded-lg ${
                  alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {getIconByTipo(alerta.tipo)}
                </span>
                Detalle de Alerta #{alerta.id}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Información completa de la alerta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${getColorByTipo(alerta.tipo)}`}>
              {getIconByTipo(alerta.tipo)}
              {alerta.tipo === 'panico' ? 'ALERTA DE PÁNICO' : 'ALERTA MÉDICA'}
            </span>
          </div>
        </div>

        {/* Grid principal - Ajustado para mejor comportamiento sticky */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Información de la alerta (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tarjeta principal */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {/* Cabecera con gradiente */}
              <div className={`bg-gradient-to-r ${getTipoGradient(alerta.tipo)} px-6 py-4`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {alerta.tipo === 'panico' ? (
                      <AlertTriangle size={28} className="text-white" />
                    ) : (
                      <Heart size={28} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {alerta.tipo === 'panico' ? 'Alerta de Pánico' : 'Emergencia Médica'}
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
                    value={formatearFecha(alerta.fecha_creacion)}
                    color="blue"
                  />
                  
                  {alerta.fecha_asignacion && (
                    <InfoCard
                      icon={Truck}
                      label="Fecha de asignación"
                      value={formatearFecha(alerta.fecha_asignacion)}
                      color="amber"
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
                </div>

                {/* Información del ciudadano */}
                {alerta.ciudadano && (
                  <div className="border-t border-gray-100 pt-6 mb-6">
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

                {/* Unidad asignada */}
                {alerta.unidad && (
                  <div className="border-t border-gray-100 pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck size={20} className="text-blue-600" />
                      Unidad Asignada
                    </h3>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl">
                            <Truck size={24} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-blue-800">{alerta.unidad.codigo}</p>
                            <p className="text-sm text-blue-600">Unidad {alerta.unidad.tipo}</p>
                          </div>
                        </div>
                        {tiempoAtencion && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Tiempo de atención</p>
                            <p className="text-lg font-semibold text-green-600">{tiempoAtencion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reporte de atención */}
                {alerta.reporte && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-purple-600" />
                      Reporte de Atención
                    </h3>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {alerta.reporte.descripcion}
                      </p>

                      {alerta.reporte.fotos && alerta.reporte.fotos.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <ImageIcon size={16} className="text-purple-500" />
                            {alerta.reporte.fotos.length} {alerta.reporte.fotos.length === 1 ? 'foto' : 'fotos'} del reporte
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {alerta.reporte.fotos.map((foto, idx) => (
                              <div
                                key={idx}
                                className="relative group cursor-pointer aspect-square"
                                onClick={() => setImagenSeleccionada(foto.url)}
                              >
                                <img
                                  src={foto.url}
                                  alt={`Reporte ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-lg border-2 border-white shadow-md group-hover:border-purple-500 transition-all"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                                  <Download size={24} className="text-white opacity-0 group-hover:opacity-100" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha: Mapa y ubicación (1/3) - AHORA CON STICKY CORREGIDO */}
          <div className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* Tarjeta de ubicación con mapa */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className={`bg-gradient-to-r ${
                  alerta.tipo === 'panico' ? 'from-red-600 to-rose-600' : 'from-green-600 to-emerald-600'
                } px-6 py-4`}>
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
                        title={mapaExpandido ? "Reducir mapa" : "Expandir mapa"}
                      >
                        {mapaExpandido ? (
                          <Minimize2 size={16} className="text-white" />
                        ) : (
                          <Maximize2 size={16} className="text-white" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {alerta.lat && alerta.lng ? (
                    <>
                      {/* Coordenadas y dirección */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-blue-600" />
                            <span className="text-xs text-gray-500">Coordenadas:</span>
                          </div>
                          <span className="text-xs font-mono font-medium text-gray-700">
                            {parseFloat(alerta.lat).toFixed(6)}, {parseFloat(alerta.lng).toFixed(6)}
                          </span>
                        </div>
                        
                        {/* Botón para abrir en Google Maps */}
                        <a
                          href={`https://www.google.com/maps?q=${alerta.lat},${alerta.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full mt-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs text-gray-600"
                        >
                          <Navigation size={14} />
                          Abrir en Google Maps
                        </a>
                      </div>

                      {/* Mapa - altura dinámica */}
                      <div className={`rounded-xl overflow-hidden border-2 border-gray-100 transition-all duration-300 ${
                        mapaExpandido ? 'h-[400px]' : 'h-[250px]'
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
                                    Alerta de Pánico
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Heart size={14} className="text-green-500" />
                                  <span className="text-xs font-medium text-gray-700">
                                    Alerta Médica
                                  </span>
                                </>
                              )}
                            </div>
                          }
                          alertaId={alerta.id}
                          altura={mapaExpandido ? "400px" : "250px"}
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

              {/* Tarjeta de información adicional - AHORA DENTRO DEL MISMO CONTENEDOR STICKY */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  Información adicional
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">ID de alerta</span>
                    <span className="text-sm font-mono font-medium text-gray-800">#{alerta.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Tipo</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getColorByTipo(alerta.tipo)}`}>
                      {alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs text-gray-500">Fecha de creación</span>
                    <span className="text-xs text-gray-800">{formatearFechaCorta(alerta.fecha_creacion)}</span>
                  </div>
                  {alerta.fecha_cierre && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-xs text-gray-500">Fecha de cierre</span>
                      <span className="text-xs text-gray-800">{formatearFechaCorta(alerta.fecha_cierre)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
              alt="Imagen completa"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-75 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
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
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
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
        title={`Contactar a ${value}`}
      >
        <ActionIcon size={16} className="text-blue-600" />
      </button>
    )}
  </div>
);

export default AlertaPanelDetail;