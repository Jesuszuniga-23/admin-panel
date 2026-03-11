import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Download,
  User, Calendar, Clock, CheckCircle, XCircle, MessageSquare,
  AlertCircle, Shield, Mail, Phone
} from 'lucide-react';
import recuperacionService from '../../../services/admin/recuperacion.service';
import toast from 'react-hot-toast';

const RecuperacionesPendientes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
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
    cargarSolicitudes();
  }, [filtros.pagina]);

  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const resultado = await recuperacionService.obtenerPendientes(filtros);
      console.log("📋 Recuperaciones pendientes:", resultado);
      setSolicitudes(resultado.data || []);
      setPaginacion({
        total: resultado.total || resultado.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: resultado.total_paginas || 1
      });
    } catch (error) {
      console.error("Error cargando recuperaciones:", error);
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar esta solicitud?')) return;
    
    try {
      await recuperacionService.aprobarSolicitud(id);
      toast.success('Solicitud aprobada correctamente');
      cargarSolicitudes(); // Recargar la lista
    } catch (error) {
      toast.error('Error al aprobar la solicitud');
    }
  };

  const handleRechazar = async (id) => {
    const motivo = window.prompt('Motivo del rechazo:');
    if (!motivo) return;
    
    try {
      await recuperacionService.rechazarSolicitud(id, motivo);
      toast.success('Solicitud rechazada');
      cargarSolicitudes();
    } catch (error) {
      toast.error('Error al rechazar la solicitud');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recuperaciones Pendientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Solicitudes de recuperación de cuenta por aprobar
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
              placeholder="Buscar solicitudes..."
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

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay solicitudes pendientes</h3>
            <p className="text-sm text-gray-500">Todas las solicitudes de recuperación han sido procesadas</p>
          </div>
        ) : (
          <div className="divide-y">
            {solicitudes.map((sol) => (
              <div key={sol.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Solicitud #{sol.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(sol.fecha_solicitud).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    Pendiente
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del solicitante */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      Datos del Solicitante
                    </h4>
                    <div className="pl-6 space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="text-gray-400">Nombre:</span>{' '}
                        {sol.solicitante?.nombre || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        {sol.solicitante?.email || 'N/A'}
                      </p>
                      {sol.solicitante?.telefono && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          {sol.solicitante.telefono}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MessageSquare size={16} className="text-gray-400" />
                      Motivo de la solicitud
                    </h4>
                    <div className="pl-6">
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {sol.motivo || 'Sin motivo especificado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleAprobar(sol.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRechazar(sol.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}

            {/* Paginación */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {((paginacion.pagina - 1) * paginacion.limite) + 1} a{' '}
                {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
                {paginacion.total} solicitudes
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacion.pagina === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {paginacion.pagina} de {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecuperacionesPendientes;