import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, MapPin, User, Phone, Clock, Eye, 
  Filter, FileText, Image as ImageIcon,
  Truck, Download, X, AlertTriangle, Heart
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const AlertasCerradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    desde: '',
    hasta: '',
    pagina: 1,
    limite: 10
  });
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    total_paginas: 1
  });
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  useEffect(() => {
    cargarAlertas();
  }, [filtros.pagina, filtros.desde, filtros.hasta]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerCerradas(filtros);
      
      if (response.success) {
        setAlertas(response.data || []);
        setPaginacion({
          total: response.total || 0,
          pagina: response.pagina || 1,
          total_paginas: response.total_paginas || 1
        });
      } else {
        setAlertas([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      desde: '',
      hasta: '',
      pagina: 1,
      limite: 10
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

  const calcularTiempoAtencion = (creacion, cierre) => {
    if (!creacion || !cierre) return 'N/A';
    const minutos = Math.round((new Date(cierre) - new Date(creacion)) / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  if (loading && alertas.length === 0) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="text-green-500" size={24} />
          Alertas Cerradas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de alertas atendidas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros({...filtros, desde: e.target.value, pagina: 1})}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros({...filtros, hasta: e.target.value, pagina: 1})}
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12">
          <Loader />
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No hay alertas cerradas</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div key={alerta.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header con íconos de Lucide */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${
                          alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {getIconByTipo(alerta.tipo)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getColorByTipo(alerta.tipo)}`}>
                          {alerta.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA'}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          #{alerta.id}
                        </span>
                        {alerta.unidad && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <Truck size={12} />
                            {alerta.unidad.codigo}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span>{alerta.ciudadano?.nombre || 'Desconocido'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span>{alerta.ciudadano?.telefono || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-gray-400" />
                          <span>Tiempo: {calcularTiempoAtencion(alerta.fecha_asignacion, alerta.fecha_cierre)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{alerta.lat?.toFixed(4)}, {alerta.lng?.toFixed(4)}</span>
                        </div>
                      </div>

                      {/* Reporte */}
                      {alerta.reporte && (
                        <div className="border-t pt-4 mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText size={14} className="text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">Reporte</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {alerta.reporte.descripcion}
                          </p>
                          {alerta.reporte.fotos?.length > 0 && (
                            <div className="flex gap-2">
                              {alerta.reporte.fotos.slice(0, 3).map((foto, idx) => (
                                <div
                                  key={idx}
                                  className="relative cursor-pointer"
                                  onClick={() => setImagenSeleccionada(foto.url)}
                                >
                                  <img
                                    src={foto.url}
                                    alt=""
                                    className="w-16 h-16 object-cover rounded-lg border hover:border-blue-500"
                                  />
                                </div>
                              ))}
                              {alerta.reporte.fotos.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                  +{alerta.reporte.fotos.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Eye size={20} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {paginacion.total_paginas > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4">
              <span className="text-sm text-gray-500">
                Página {filtros.pagina} de {paginacion.total_paginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros({...filtros, pagina: filtros.pagina - 1})}
                  disabled={filtros.pagina === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFiltros({...filtros, pagina: filtros.pagina + 1})}
                  disabled={filtros.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenSeleccionada(null)}
        >
          <div className="relative">
            <img
              src={imagenSeleccionada}
              alt=""
              className="max-h-screen max-w-full object-contain"
            />
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasCerradas;