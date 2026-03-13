import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, MapPin, User, Phone, Clock, Eye, 
  Truck, AlertTriangle, Heart
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const AlertasEnProceso = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    total_paginas: 1
  });
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    cargarAlertas();
  }, [pagina]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerEnProceso({ pagina, limite: 10 });
      
      if (response.success) {
        setAlertas(response.data || []);
        setPaginacion({
          total: response.total || 0,
          pagina: response.pagina || 1,
          total_paginas: response.total_paginas || 1
        });
      }
    } catch (error) {
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
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

  const getEstadoColor = (estado) => {
    return estado === 'asignada'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-blue-100 text-blue-700';
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
          <Activity className="text-yellow-500" size={24} />
          Alertas en Proceso
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Alertas siendo atendidas por unidades
        </p>
      </div>

      {alertas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Activity size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No hay alertas en proceso</p>
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
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(alerta.estado)}`}>
                          {alerta.estado === 'asignada' ? 'ASIGNADA' : 'ATENDIENDO'}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          #{alerta.id}
                        </span>
                      </div>

                      {/* Unidad */}
                      {alerta.unidad && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-blue-500" />
                            <span className="font-medium text-blue-700">{alerta.unidad.codigo}</span>
                            <span className="text-xs text-blue-600 ml-2">({alerta.unidad.tipo})</span>
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span>{alerta.ciudadano?.nombre || 'Desconocido'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span>{alerta.ciudadano?.telefono || 'N/A'}</span>
                        </div>
                        {alerta.lat && alerta.lng && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{alerta.lat.toFixed(4)}, {alerta.lng.toFixed(4)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-gray-400" />
                          <span>Asignada: {new Date(alerta.fecha_asignacion).toLocaleString()}</span>
                        </div>
                      </div>
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
                Página {pagina} de {paginacion.total_paginas}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina(p => p - 1)}
                  disabled={pagina === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPagina(p => p + 1)}
                  disabled={pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlertasEnProceso;