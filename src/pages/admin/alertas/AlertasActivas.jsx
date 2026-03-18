import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MapPin, User, Phone, Clock, Eye, 
  Filter, Mail, AlertTriangle, Heart, ChevronLeft,
  X, Maximize2, Minimize2, Calendar, MapPinned
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import MapaConDireccion from '../../../components/maps/MapaConDireccion';
import toast from 'react-hot-toast';

const AlertasActivas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qué alerta tiene el mapa abierto
  const [alertaConMapaAbierto, setAlertaConMapaAbierto] = useState(null);
  
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

  // Función para alternar el mapa de una alerta
  const toggleMapa = (alertaId) => {
    if (alertaConMapaAbierto === alertaId) {
      setAlertaConMapaAbierto(null); // Cerrar si ya está abierto
    } else {
      setAlertaConMapaAbierto(alertaId); // Abrir el nuevo
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

  const getGradientByTipo = (tipo) => {
    return tipo === 'panico'
      ? 'from-red-50 to-rose-50 border-red-100'
      : 'from-green-50 to-emerald-50 border-green-100';
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

  if (loading && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-xl shadow-lg shadow-red-200">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Activas</h1>
              <p className="text-sm text-gray-500 mt-1">
                {paginacion.total} {paginacion.total === 1 ? 'alerta espera' : 'alertas esperan'} ser atendidas
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-gray-600 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros de búsqueda</span>
            {(filtros.desde || filtros.hasta) && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full ml-2">
                Filtros activos
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros({...filtros, desde: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros({...filtros, hasta: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex items-end gap-2 lg:col-span-2">
              <button
                onClick={limpiarFiltros}
                className="px-6 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-600"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        {loading ? (
          <div className="text-center py-12">
            <Loader />
          </div>
        ) : alertas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay alertas activas</h3>
            <p className="text-sm text-gray-400">Todas las alertas han sido atendidas o asignadas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {alertas.map((alerta) => {
              const mapaAbierto = alertaConMapaAbierto === alerta.id;
              
              return (
                <div
                  key={alerta.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden"
                >
                  {/* Cabecera de la alerta */}
                  <div className={`bg-gradient-to-r ${getGradientByTipo(alerta.tipo)} px-6 py-3 border-b flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        alerta.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {getIconByTipo(alerta.tipo)}
                      </div>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColorByTipo(alerta.tipo)}`}>
                          {alerta.tipo === 'panico' ? 'ALERTA DE PÁNICO' : 'ALERTA MÉDICA'}
                        </span>
                        <span className="ml-3 text-xs text-gray-500">
                          ID: #{alerta.id}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-white px-3 py-1 rounded-full shadow-sm">
                      {formatearFechaCorta(alerta.fecha_creacion)}
                    </span>
                  </div>

                  {/* Contenido principal */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Columna izquierda: Información del ciudadano */}
                      <div className="lg:col-span-1 space-y-4">
                        {/* Tarjeta de ciudadano */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                          <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <User size={14} className="text-blue-600" />
                            CIUDADANO
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-bold text-lg">
                                  {alerta.ciudadano?.nombre?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {alerta.ciudadano?.nombre || 'Desconocido'}
                                </p>
                                <p className="text-xs text-gray-500">Ciudadano</p>
                              </div>
                            </div>

                            {alerta.ciudadano?.telefono && (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                                <Phone size={14} className="text-blue-500" />
                                <span className="text-sm text-gray-700">{alerta.ciudadano.telefono}</span>
                              </div>
                            )}

                            {alerta.ciudadano?.email && (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                                <Mail size={14} className="text-blue-500" />
                                <span className="text-sm text-gray-700 truncate">{alerta.ciudadano.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tiempo transcurrido */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
                          <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-amber-600" />
                            TIEMPO DE ESPERA
                          </h3>
                          <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-amber-100">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-amber-700">
                                {Math.floor((new Date() - new Date(alerta.fecha_creacion)) / 60000)} min
                              </p>
                              <p className="text-xs text-gray-500 mt-1">desde su creación</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna derecha: Mapa (2 columnas) */}
                      <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                              <MapPinned size={14} className="text-blue-600" />
                              UBICACIÓN DEL EVENTO
                            </h3>
                            
                            {alerta.lat && alerta.lng && (
                              <button
                                onClick={() => toggleMapa(alerta.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-xs font-medium text-gray-600"
                              >
                                {mapaAbierto ? (
                                  <>
                                    <Minimize2 size={14} />
                                    <span className="hidden sm:inline">Ocultar mapa</span>
                                  </>
                                ) : (
                                  <>
                                    <MapPin size={14} />
                                    <span className="hidden sm:inline">Ver ubicación</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Coordenadas (siempre visibles) */}
                          {alerta.lat && alerta.lng && (
                            <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200 inline-block">
                              <span className="text-xs font-mono text-gray-600">
                                {alerta.lat.toFixed(6)}, {alerta.lng.toFixed(6)}
                              </span>
                            </div>
                          )}

                          {/* Mapa (condicional) */}
                          {mapaAbierto && alerta.lat && alerta.lng && (
                            <div className="mt-3 rounded-lg overflow-hidden border-2 border-white shadow-lg animate-fadeIn">
                              <MapaConDireccion
                                lat={alerta.lat}
                                lng={alerta.lng}
                                titulo={
                                  <div className="flex items-center gap-1.5">
                                    {alerta.tipo === 'panico' ? (
                                      <>
                                        <AlertTriangle size={14} className="text-red-500" />
                                        <span className="text-xs font-medium text-gray-700">Alerta de Pánico Activa</span>
                                      </>
                                    ) : (
                                      <>
                                        <Heart size={14} className="text-green-500" />
                                        <span className="text-xs font-medium text-gray-700">Alerta Médica Activa</span>
                                      </>
                                    )}
                                  </div>
                                }
                                alertaId={alerta.id}
                                altura="280px"
                              />
                            </div>
                          )}

                          {!alerta.lat || !alerta.lng ? (
                            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                              <MapPin size={24} className="opacity-30 mr-2" />
                              Coordenadas no disponibles
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer con acciones */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => navigate(`/admin/alertas/${alerta.id}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all text-sm font-medium text-gray-600 group"
                    >
                      <Eye size={16} className="group-hover:text-blue-600" />
                      Ver detalle completo
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {paginacion.total_paginas > 1 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Mostrando <span className="font-medium text-gray-700">
                {((paginacion.pagina - 1) * filtros.limite) + 1}
              </span> a{' '}
              <span className="font-medium text-gray-700">
                {Math.min(paginacion.pagina * filtros.limite, paginacion.total)}
              </span> de{' '}
              <span className="font-medium text-gray-700">{paginacion.total}</span> alertas
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltros({...filtros, pagina: filtros.pagina - 1})}
                disabled={filtros.pagina === 1}
                className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Página {filtros.pagina} de {paginacion.total_paginas}
              </span>
              
              <button
                onClick={() => setFiltros({...filtros, pagina: filtros.pagina + 1})}
                disabled={filtros.pagina === paginacion.total_paginas}
                className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos para animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AlertasActivas;