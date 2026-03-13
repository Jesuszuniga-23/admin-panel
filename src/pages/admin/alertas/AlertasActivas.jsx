import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MapPin, User, Phone, Clock, Eye, 
  Filter, Mail, AlertTriangle, Heart
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import toast from 'react-hot-toast';

const AlertasActivas = () => {
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

  useEffect(() => {
    cargarAlertas();
  }, [filtros.pagina, filtros.desde, filtros.hasta]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      const response = await alertasPanelService.obtenerActivas(filtros);
      
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

  if (loading && alertas.length === 0) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-red-500" size={24} />
          Alertas Activas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Alertas sin asignar que esperan ser atendidas
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
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros({...filtros, hasta: e.target.value, pagina: 1})}
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
        {(filtros.desde || filtros.hasta) && (
          <div className="mt-2 text-xs text-blue-600">
            ✓ Filtros aplicados
          </div>
        )}
      </div>

      {/* Lista de Alertas */}
      {loading ? (
        <div className="text-center py-12">
          <Loader />
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-lg">No hay alertas activas</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Tipo de alerta con íconos de Lucide */}
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
                          ID: {alerta.id}
                        </span>
                      </div>

                      {/* Información del ciudadano */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-gray-400" />
                          <span className="text-gray-700">{alerta.ciudadano?.nombre || 'Desconocido'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-700">{alerta.ciudadano?.telefono || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-700">{alerta.ciudadano?.email || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Ubicación y tiempo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerta.lat && alerta.lng && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-gray-600 font-mono">
                              {alerta.lat.toFixed(6)}, {alerta.lng.toFixed(6)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-gray-600">
                            {formatearFecha(alerta.fecha_creacion)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={20} className="text-gray-400 hover:text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {paginacion.total_paginas > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-500">
                Página {filtros.pagina} de {paginacion.total_paginas}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros({...filtros, pagina: filtros.pagina - 1})}
                  disabled={filtros.pagina === 1}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 text-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFiltros({...filtros, pagina: filtros.pagina + 1})}
                  disabled={filtros.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg disabled:opacity-50 text-sm"
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

export default AlertasActivas;