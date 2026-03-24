// src/pages/admin/alertas/AlertasExpiradas.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Calendar, User, Clock, X, AlertTriangle 
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import { BadgeTipoAlerta, BotonMapa, ModalMapa } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';

// Función para normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  const reemplazos = [
    { de: '¡', para: 'í' }, { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' },
    { de: '€', para: 'e' }, { de: '‚', para: 'é' }, { de: '¢', para: 'o' },
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã�', para: 'Á' },
    { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã±', para: 'ñ' }, { de: 'Ã‘', para: 'Ñ' },
    { de: 'Â¿', para: '¿' }, { de: 'Â¡', para: '¡' }
  ];
  
  let textoNormalizado = texto;
  reemplazos.forEach(({ de, para }) => {
    textoNormalizado = textoNormalizado.split(de).join(para);
  });
  
  return textoNormalizado;
};

const formatearNombre = (nombre) => {
  if (!nombre) return '';
  const nombreNormalizado = normalizarTexto(nombre);
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const AlertasExpiradas = () => {
  const navigate = useNavigate();
  
  // Obtener tipo de alerta permitido según rol
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [mapaModal, setMapaModal] = useState({
    abierto: false,
    lat: null,
    lng: null,
    titulo: null,
    alertaId: null,
    tipo: null
  });
  
  const [filtros, setFiltros] = useState({
    limite: 10,
    pagina: 1,
    desde: '',
    hasta: '',
    search: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  useEffect(() => {
    cargarAlertas();
  }, []);

  const filtrarDatos = (datos) => {
    return datos.filter(item => {
      if (filtros.search) {
        const termino = filtros.search.toLowerCase().trim();
        const idMatch = item.id?.toString().includes(termino);
        const tipoMatch = item.tipo?.toLowerCase().includes(termino) ||
                         (termino === 'panico' && item.tipo === 'panico') ||
                         (termino === 'pánico' && item.tipo === 'panico') ||
                         (termino === 'medica' && item.tipo === 'medica') ||
                         (termino === 'médica' && item.tipo === 'medica');
        const ciudadanoMatch = item.ciudadano?.nombre?.toLowerCase().includes(termino);
        if (!idMatch && !tipoMatch && !ciudadanoMatch) return false;
      }
      
      if (filtros.desde && filtros.hasta) {
        const fechaCreacion = new Date(item.fecha_creacion);
        const desdeParts = filtros.desde.split('-');
        const hastaParts = filtros.hasta.split('-');
        const desde = new Date(parseInt(desdeParts[0]), parseInt(desdeParts[1]) - 1, parseInt(desdeParts[2]), 0, 0, 0, 0);
        const hasta = new Date(parseInt(hastaParts[0]), parseInt(hastaParts[1]) - 1, parseInt(hastaParts[2]), 23, 59, 59, 999);
        if (fechaCreacion < desde || fechaCreacion > hasta) return false;
      } else {
        if (filtros.desde) {
          const desdeParts = filtros.desde.split('-');
          const desde = new Date(parseInt(desdeParts[0]), parseInt(desdeParts[1]) - 1, parseInt(desdeParts[2]), 0, 0, 0, 0);
          const fechaCreacion = new Date(item.fecha_creacion);
          if (fechaCreacion < desde) return false;
        }
        if (filtros.hasta) {
          const hastaParts = filtros.hasta.split('-');
          const hasta = new Date(parseInt(hastaParts[0]), parseInt(hastaParts[1]) - 1, parseInt(hastaParts[2]), 23, 59, 59, 999);
          const fechaCreacion = new Date(item.fecha_creacion);
          if (fechaCreacion > hasta) return false;
        }
      }
      return true;
    });
  };

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const params = {};
      if (tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
      }
      const resultado = await alertasService.obtenerExpiradas({ limite: 1000, ...params });
      const alertasFormateadas = (resultado.data || []).map(alerta => ({
        ...alerta,
        ciudadano: alerta.ciudadano ? {
          ...alerta.ciudadano,
          nombre: formatearNombre(alerta.ciudadano.nombre)
        } : null
      }));
      setAlertasOriginal(alertasFormateadas);
      aplicarFiltrosLocal(alertasFormateadas);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    const datosFiltrados = filtrarDatos(datos);
    const total = datosFiltrados.length;
    const totalPaginas = Math.ceil(total / filtros.limite);
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    setAlertas(datosPaginados);
    setPaginacion({
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
      total_paginas: totalPaginas
    });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const handleLimpiarBusqueda = () => {
    setSearchInput('');
    setFiltros(prev => ({ ...prev, search: '', pagina: 1 }));
  };

  const aplicarFiltros = () => {
    setFiltros(prev => ({ ...prev, pagina: 1 }));
    aplicarFiltrosLocal();
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

  const abrirMapaModal = (e, alerta) => {
    e.stopPropagation();
    setMapaModal({
      abierto: true,
      lat: alerta.lat,
      lng: alerta.lng,
      titulo: alerta.tipo === 'panico' ? 'Alerta de Pánico' : 'Alerta Médica',
      alertaId: alerta.id,
      tipo: alerta.tipo
    });
  };

  const cerrarMapaModal = () => {
    setMapaModal({
      abierto: false,
      lat: null,
      lng: null,
      titulo: null,
      alertaId: null,
      tipo: null
    });
  };

  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros.search, filtros.desde, filtros.hasta, filtros.pagina]);

  const handleRowClick = (alertaId) => {
    navigate(`/admin/alertas/expiradas/${alertaId}`);
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

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  if (cargando && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
            <p className="mt-3 text-sm text-slate-500">Cargando alertas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-gray-200">
              <AlertTriangle size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Expiradas</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Alertas que no fueron atendidas a tiempo
                {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all text-slate-600 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-5 mb-6">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Filter size={14} className="sm:w-4 sm:h-4 text-gray-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-700">Filtros</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded-full ml-2">
              Búsqueda por tipo
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, tipo (pánico/médica) o ciudadano..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all text-xs sm:text-sm"
                />
                {searchInput && (
                  <button
                    onClick={handleLimpiarBusqueda}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                  >
                    <X size={12} className="text-slate-400" />
                  </button>
                )}
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
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all text-xs sm:text-sm"
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
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg md:rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
              <button
                onClick={aplicarFiltros}
                className="flex-1 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg md:rounded-xl shadow-sm shadow-gray-200 hover:bg-gray-700 hover:shadow-md transition-all text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                Aplicar
              </button>
              <button
                onClick={limpiarFiltros}
                className="flex-1 px-3 sm:px-4 py-2 border border-slate-200 bg-white rounded-lg md:rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap"
              >
                Limpiar
              </button>
            </div>
          </div>

          {(filtros.desde || filtros.hasta || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
              <span className="text-gray-600">Filtros aplicados - {paginacion.total} resultados</span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {cargando ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
              <p className="mt-3 text-xs sm:text-sm text-slate-500">Cargando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-8 md:p-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} className="md:w-7 md:h-7 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-base font-medium text-slate-700 mb-1">No hay alertas expiradas</h3>
              <p className="text-xs text-slate-400">
                Todas las alertas han sido atendidas a tiempo
                {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] md:min-w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">TIPO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">CIUDADANO</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">UBICACIÓN</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">FECHA</th>
                      <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-slate-500 uppercase">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id} 
                        onClick={() => handleRowClick(alerta.id)}
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <BadgeTipoAlerta tipo={alerta.tipo} size={12} />
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <User size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[80px] md:max-w-[150px]">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          {alerta.lat && alerta.lng ? (
                            <BotonMapa
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              texto="Ver mapa"
                              size={14}
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <div className="flex items-center gap-1 md:gap-2">
                            <Clock size={12} className="md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-xs md:text-sm text-slate-600 truncate max-w-[70px] md:max-w-[120px]">
                              {formatearFecha(alerta.fecha_creacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-slate-100 text-slate-600 rounded-full">
                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                            <span>Expirada</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-slate-600">
                  Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de{' '}
                  <span className="font-medium">{paginacion.total}</span> registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs sm:text-sm text-slate-600">
                    Página <span className="font-medium">{paginacion.pagina}</span> de{' '}
                    <span className="font-medium">{paginacion.total_paginas}</span>
                  </span>
                  <button
                    onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal del Mapa - Usando componente reutilizable */}
      <ModalMapa
        isOpen={mapaModal.abierto}
        onClose={cerrarMapaModal}
        lat={mapaModal.lat}
        lng={mapaModal.lng}
        titulo={mapaModal.titulo}
        alertaId={mapaModal.alertaId}
        tipo={mapaModal.tipo}
      />
    </div>
  );
};

export default AlertasExpiradas;