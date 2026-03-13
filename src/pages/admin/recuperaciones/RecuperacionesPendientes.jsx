import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Download,
  User, Calendar, Clock, CheckCircle, XCircle, MessageSquare,
  AlertCircle, Shield, Mail, Phone, RefreshCw
} from 'lucide-react';
import recuperacionService from '../../../services/admin/recuperacion.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';

const RecuperacionesPendientes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  
  // Filtros mejorados
  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1,
    search: '',
    estado: 'pendiente' // pendiente, aprobada, rechazada
  });

  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  const searchTerm = useDebounce(filtros.search, 500);

  // =====================================================
  // TIEMPO REAL - Cargar cada 30 segundos
  // =====================================================
  useEffect(() => {
    cargarSolicitudes();
    
    const intervalo = setInterval(() => {
      console.log('🔄 Recargando solicitudes (tiempo real)');
      cargarSolicitudes(true);
    }, 30000);

    return () => clearInterval(intervalo);
  }, [filtros.pagina, filtros.estado, searchTerm]);

  const cargarSolicitudes = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const filtrosActivos = {};
      
      if (filtros.search && filtros.search.trim() !== '') {
        filtrosActivos.search = filtros.search;
      }
      if (filtros.estado) {
        filtrosActivos.estado = filtros.estado;
      }
      
      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;

      console.log("📋 Cargando recuperaciones con filtros:", filtrosActivos);
      const resultado = await recuperacionService.obtenerPendientes(filtrosActivos);
      
      setSolicitudes(resultado.data || []);
      setUltimaActualizacion(new Date());
      setPaginacion({
        total: resultado.total || resultado.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: resultado.total_paginas || 1
      });

      // Notificar si hay cambios
      if (!silencioso && resultado.data?.length > solicitudes.length) {
        toast('📢 Nuevas solicitudes recibidas', {
          icon: '📋',
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error cargando recuperaciones:", error);
      if (!silencioso) toast.error('Error al cargar solicitudes');
      setSolicitudes([]);
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  // Manejador de búsqueda en tiempo real
  const handleSearchChange = (e) => {
    setFiltros(prev => ({ ...prev, search: e.target.value, pagina: 1 }));
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar esta solicitud?')) return;
    
    try {
      await recuperacionService.aprobarSolicitud(id);
      toast.success('✅ Solicitud aprobada correctamente');
      cargarSolicitudes(); // Recargar inmediatamente
    } catch (error) {
      toast.error('❌ Error al aprobar la solicitud');
    }
  };

  const handleRechazar = async (id) => {
    const motivo = window.prompt('Motivo del rechazo:');
    if (!motivo) return;
    
    try {
      await recuperacionService.rechazarSolicitud(id, motivo);
      toast.success('✅ Solicitud rechazada');
      cargarSolicitudes();
    } catch (error) {
      toast.error('❌ Error al rechazar la solicitud');
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      limite: 10,
      pagina: 1,
      search: '',
      estado: 'pendiente'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header con indicador de tiempo real */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Recuperaciones Pendientes</h1>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Tiempo real
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Solicitudes de recuperación de cuenta por aprobar
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => cargarSolicitudes()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Actualizar manualmente"
          >
            <RefreshCw size={18} className={`text-gray-500 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
            Dashboard
          </button>
        </div>
      </div>

      {/* Filtros en tiempo real */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Filtros en tiempo real</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full ml-2">
            Búsqueda instantánea
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda en tiempo real */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filtros.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="">Todas</option>
          </select>

          {/* Botón limpiar */}
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>

        {/* Indicador de filtros activos */}
        {(filtros.search || filtros.estado !== 'pendiente') && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-blue-600">Filtros aplicados en tiempo real</span>
          </div>
        )}
      </div>

      {/* Indicador de recarga automática */}
      <div className="flex justify-end mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin-slow" />
          Actualizando cada 30 segundos
        </span>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {cargando && solicitudes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay solicitudes {filtros.estado !== 'pendiente' ? `en estado "${filtros.estado}"` : 'pendientes'}</h3>
            <p className="text-sm text-gray-500">
              {filtros.search 
                ? 'No se encontraron resultados con tu búsqueda' 
                : 'Todas las solicitudes han sido procesadas'}
            </p>
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
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(sol.fecha_solicitud).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sol.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                    sol.estado === 'aprobada' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {sol.estado || 'Pendiente'}
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

                {/* Acciones (solo si está pendiente) */}
                {sol.estado === 'pendiente' && (
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
                )}
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
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {paginacion.pagina} / {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
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