import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar,
  ChevronLeft, ChevronRight, Filter, Search, Download,
  XCircle, CheckCircle, Activity
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';

const AlertasExpiradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1
  });
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  useEffect(() => {
    cargarAlertas();
  }, [filtros.pagina]);

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const resultado = await alertasService.obtenerExpiradas(filtros);
      setAlertas(resultado.data || []);
      setPaginacion(resultado.paginacion || {
        total: resultado.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: 1
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar clic en fila
  const handleRowClick = (alertaId) => {
    navigate(`/admin/alertas/${alertaId}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Alertas Expiradas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Alertas que no fueron atendidas a tiempo
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={18} />
          Volver al Dashboard
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alertas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter size={18} className="text-gray-500" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={18} className="text-gray-500" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabla de Alertas */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando alertas...</p>
          </div>
        ) : alertas.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay alertas expiradas</h3>
            <p className="text-sm text-gray-500">Todas las alertas han sido atendidas a tiempo</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ciudadano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alertas.map((alerta) => (
                  <tr 
                    key={alerta.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(alerta.id)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">#{alerta.id}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alerta.tipo === 'panico' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alerta.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {alerta.ciudadano?.nombre || 'Desconocido'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 truncate max-w-xs">
                          {alerta.ubicacion ? 'Ubicación disponible' : 'Sin ubicación'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(alerta.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                        Expirada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((paginacion.pagina - 1) * paginacion.limite) + 1} a{' '}
                {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
                {paginacion.total} alertas
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacion.pagina === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertasExpiradas;