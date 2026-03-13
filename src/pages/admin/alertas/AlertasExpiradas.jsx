import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Calendar, User, MapPin,
  AlertTriangle, Clock
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';

const AlertasExpiradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1,
    desde: '',
    hasta: '',
    search: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  useEffect(() => {
    cargarAlertas();
  }, [filtros.pagina, filtros.desde, filtros.hasta]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(() => {
      setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
    }, 500);

    setSearchTimeout(timeout);
  };

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const resultado = await alertasService.obtenerExpiradas(filtros);
      setAlertas(resultado.data || []);
      setPaginacion({
        total: resultado.total || resultado.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: resultado.total_paginas || 1
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    setFiltros(prev => ({ ...prev, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setSearchInput('');
    setFiltros({
      limite: 10,
      pagina: 1,
      desde: '',
      hasta: '',
      search: ''
    });
  };

  const handleRowClick = (alertaId) => {
    navigate(`/admin/alertas/${alertaId}`);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg shadow-slate-200/50">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Alertas Expiradas</h1>
              <p className="text-xs text-slate-500">Alertas que no fueron atendidas a tiempo</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all text-slate-600 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Dashboard
          </button>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Filtros</span>
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-2">
              Tiempo real
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID o ciudadano..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => setFiltros({...filtros, desde: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => setFiltros({...filtros, hasta: e.target.value, pagina: 1})}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={aplicarFiltros}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl shadow-sm shadow-amber-200 hover:bg-amber-700 hover:shadow-md transition-all text-sm font-medium"
              >
                Aplicar
              </button>
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium text-slate-600"
              >
                Limpiar
              </button>
            </div>
          </div>

          {(filtros.desde || filtros.hasta || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              <span className="text-amber-600">Filtros aplicados</span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {cargando ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600"></div>
              <p className="mt-3 text-sm text-slate-500">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={28} className="text-slate-400" />
              </div>
              <h3 className="text-base font-medium text-slate-700 mb-1">No hay alertas expiradas</h3>
              <p className="text-xs text-slate-400">Todas las alertas han sido atendidas a tiempo</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ciudadano</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ubicación</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id} 
                        onClick={() => handleRowClick(alerta.id)}
                        className="hover:bg-amber-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-slate-600">#{alerta.id}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            alerta.tipo === 'panico' 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {alerta.tipo === 'panico' ? 'Pánico' : 'Médica'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {alerta.lat && alerta.lng ? (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} className="text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {alerta.lat.toFixed(4)}, {alerta.lng.toFixed(4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {formatearFecha(alerta.fecha_creacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            Expirada
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación con color */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {((paginacion.pagina - 1) * paginacion.limite) + 1} - {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                    disabled={paginacion.pagina === 1}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 disabled:opacity-50 transition-all"
                  >
                    <ChevronLeft size={16} className="text-slate-600" />
                  </button>
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 disabled:opacity-50 transition-all"
                  >
                    <ChevronRight size={16} className="text-slate-600" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertasExpiradas;