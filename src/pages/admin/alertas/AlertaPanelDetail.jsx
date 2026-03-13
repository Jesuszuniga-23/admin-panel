import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader, AlertCircle, MapPin, User, Phone,
  Mail, Clock, Truck, FileText, Image as ImageIcon,
  Calendar, Download, X, CheckCircle
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';

const AlertaPanelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      setLoading(true);
      console.log(`📡 Cargando alerta ID: ${id} desde panel`);
      const response = await alertasPanelService.obtenerDetalle(id);
      
      if (response.success && response.data) {
        console.log('✅ Alerta cargada:', response.data);
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

  const getColorByTipo = (tipo) => {
    return tipo === 'panico' 
      ? 'bg-red-100 text-red-700 border-red-200' 
      : 'bg-green-100 text-green-700 border-green-200';
  };

  const getIconByTipo = (tipo) => {
    return tipo === 'panico' ? '🚨' : '🚑';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error || !alerta) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Alerta no encontrada'}</p>
          <button
            onClick={() => navigate('/admin/alertas/cerradas')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">{getIconByTipo(alerta.tipo)}</span>
            Alerta #{alerta.id}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Detalle completo de la alerta
          </p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium border ${getColorByTipo(alerta.tipo)}`}>
          {alerta.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA'}
        </span>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Información del ciudadano */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={16} />
              Datos del ciudadano
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-gray-400" />
                <span className="font-medium text-gray-800">{alerta.ciudadano?.nombre || 'Desconocido'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <a href={`tel:${alerta.ciudadano?.telefono}`} className="text-blue-600 hover:underline">
                  {alerta.ciudadano?.telefono || 'N/A'}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gray-400" />
                <a href={`mailto:${alerta.ciudadano?.email}`} className="text-blue-600 hover:underline">
                  {alerta.ciudadano?.email || 'N/A'}
                </a>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          {alerta.lat && alerta.lng && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Ubicación
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-gray-400" />
                <span className="font-mono text-gray-800">
                  {alerta.lat.toFixed(6)}, {alerta.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}

          {/* Unidad asignada (si existe) */}
          {alerta.unidad && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Truck size={16} />
                Unidad asignada
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <Truck size={14} className="text-blue-400" />
                <span className="font-medium text-blue-800">{alerta.unidad.codigo}</span>
                <span className="text-xs text-blue-600 ml-2 capitalize">({alerta.unidad.tipo})</span>
              </div>
            </div>
          )}

          {/* Línea de tiempo */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Línea de tiempo
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-600">Creada:</span>
                <span className="font-medium text-gray-800">{formatearFecha(alerta.fecha_creacion)}</span>
              </div>
              {alerta.fecha_asignacion && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={14} className="text-gray-400" />
                  <span className="text-gray-600">Asignada:</span>
                  <span className="font-medium text-gray-800">{formatearFecha(alerta.fecha_asignacion)}</span>
                </div>
              )}
              {alerta.fecha_cierre && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle size={14} className="text-gray-400" />
                  <span className="text-gray-600">Cerrada:</span>
                  <span className="font-medium text-gray-800">{formatearFecha(alerta.fecha_cierre)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reporte */}
          {alerta.reporte && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} />
                Reporte de atención
              </h2>
              
              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 mb-4">
                {alerta.reporte.descripcion}
              </p>

              {alerta.reporte.fotos && alerta.reporte.fotos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <ImageIcon size={12} />
                    {alerta.reporte.fotos.length} {alerta.reporte.fotos.length === 1 ? 'foto' : 'fotos'}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {alerta.reporte.fotos.map((foto, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer aspect-square"
                        onClick={() => setImagenSeleccionada(foto.url)}
                      >
                        <img
                          src={foto.url}
                          alt={`Reporte ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <Download size={20} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para ver imagen grande */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenSeleccionada(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imagenSeleccionada}
              alt="Imagen completa"
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertaPanelDetail;