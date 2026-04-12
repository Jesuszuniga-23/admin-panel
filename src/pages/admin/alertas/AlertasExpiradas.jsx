// src/pages/admin/alertas/AlertasExpiradas.jsx (CORREGIDO - ORDEN DESCENDENTE)
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Filter, Search, Calendar, User, Clock, X, AlertTriangle,
  Shield, Lock, CheckCircle
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import { BadgeTipoAlerta, BotonMapa, ModalMapa } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';
import { useOtp } from '../../../hooks/useOtp';
import toast from 'react-hot-toast';

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
  
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [detalleLoading, setDetalleLoading] = useState(false);
  
  const abortControllerRef = useRef(null);
  const detalleAbortControllerRef = useRef(null);
  
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [mostrarModalOtp, setMostrarModalOtp] = useState(false);
  const [datosCompletosAlerta, setDatosCompletosAlerta] = useState(null);
  const [codigoOtp, setCodigoOtp] = useState('');
  
  const {
    solicitando,
    verificando,
    solicitarOtp,
    verificarOtp,
    cerrarModal: cerrarModalOtpHook,
    showModal: showModalHook,
    otpEmail,
    otpExpiracion
  } = useOtp();
  
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

  // ✅ FUNCIÓN CORREGIDA - CON ORDEN DESCENDENTE POR FECHA DE CREACIÓN
  const aplicarFiltrosLocalDirecto = useCallback((datos) => {
    if (!datos || datos.length === 0) return [];
    
    let datosFiltrados = [...datos];
    
    // 1. FILTRO DE SEGURIDAD LOCAL
    if (tipoAlertaPermitido) {
      datosFiltrados = datosFiltrados.filter(item => item.tipo === tipoAlertaPermitido);
    }
    
    // 2. FILTRO POR BÚSQUEDA
    if (filtros.search && filtros.search.trim() !== '') {
      const termino = filtros.search.toLowerCase().trim();
      datosFiltrados = datosFiltrados.filter(item => {
        const idMatch = item.id?.toString().includes(termino);
        const tipoMatch = item.tipo?.toLowerCase().includes(termino);
        const ciudadanoMatch = item.ciudadano?.nombre?.toLowerCase().includes(termino);
        return idMatch || tipoMatch || ciudadanoMatch;
      });
    }
    
    // 3. FILTRO POR FECHA DESDE
    if (filtros.desde) {
      const desdeParts = filtros.desde.split('-');
      const desde = new Date(parseInt(desdeParts[0]), parseInt(desdeParts[1]) - 1, parseInt(desdeParts[2]), 0, 0, 0, 0);
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaCreacion = new Date(item.fecha_creacion);
        return fechaCreacion >= desde;
      });
    }
    
    // 4. FILTRO POR FECHA HASTA
    if (filtros.hasta) {
      const hastaParts = filtros.hasta.split('-');
      const hasta = new Date(parseInt(hastaParts[0]), parseInt(hastaParts[1]) - 1, parseInt(hastaParts[2]), 23, 59, 59, 999);
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaCreacion = new Date(item.fecha_creacion);
        return fechaCreacion <= hasta;
      });
    }
    
    // ✅ 5. ORDENAR POR FECHA DE CREACIÓN: MÁS RECIENTES PRIMERO (HOY → AYER → ANTIGUAS)
    datosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha_creacion);
      const fechaB = new Date(b.fecha_creacion);
      return fechaB - fechaA; // DESCENDENTE: más reciente primero
    });
    
    // 6. PAGINACIÓN
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    
    return datosPaginados;
  }, [tipoAlertaPermitido, filtros.search, filtros.desde, filtros.hasta, filtros.pagina, filtros.limite]);

  // ✅ Cargar alertas desde el backend
  const cargarAlertas = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en AlertasExpiradas');
    }
    
    abortControllerRef.current = new AbortController();
    
    setCargando(true);
    try {
      const params = { 
        limite: 1000,
        signal: abortControllerRef.current.signal 
      };
      
      if (tipoAlertaPermitido) {
        params.tipoFiltro = tipoAlertaPermitido;
      }
      
      const resultado = await alertasService.obtenerExpiradas(params);
      
      console.log('📊 [DEBUG] resultado completo:', resultado);
      console.log('📊 [DEBUG] resultado.data length:', resultado.data?.length);
      
      const datosAlerta = resultado.data || [];
      
      const alertasFormateadas = datosAlerta.map(alerta => ({
        ...alerta,
        ciudadano: alerta.ciudadano ? {
          ...alerta.ciudadano,
          nombre: formatearNombre(alerta.ciudadano.nombre)
        } : null
      }));
      
      console.log('📊 [DEBUG] alertasFormateadas length:', alertasFormateadas.length);
      
      setAlertasOriginal(alertasFormateadas);
      
      const datosFiltrados = aplicarFiltrosLocalDirecto(alertasFormateadas);
      console.log('📊 [DEBUG] datosFiltrados length:', datosFiltrados.length);
      
      setAlertas(datosFiltrados);
      setPaginacion({
        total: alertasFormateadas.filter(item => {
          if (tipoAlertaPermitido && item.tipo !== tipoAlertaPermitido) return false;
          return true;
        }).length,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: Math.ceil(alertasFormateadas.filter(item => {
          if (tipoAlertaPermitido && item.tipo !== tipoAlertaPermitido) return false;
          return true;
        }).length / filtros.limite)
      });
      
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error:", error);
        toast.error('Error al cargar alertas expiradas');
      }
    } finally {
      setCargando(false);
    }
  }, [tipoAlertaPermitido, filtros.pagina, filtros.limite, aplicarFiltrosLocalDirecto]);

  // ✅ Re-aplicar filtros cuando cambian
  useEffect(() => {
    if (alertasOriginal.length > 0) {
      const datosFiltrados = aplicarFiltrosLocalDirecto(alertasOriginal);
      setAlertas(datosFiltrados);
      setPaginacion(prev => ({
        ...prev,
        total: alertasOriginal.filter(item => {
          if (tipoAlertaPermitido && item.tipo !== tipoAlertaPermitido) return false;
          return true;
        }).length,
        total_paginas: Math.ceil(alertasOriginal.filter(item => {
          if (tipoAlertaPermitido && item.tipo !== tipoAlertaPermitido) return false;
          return true;
        }).length / filtros.limite)
      }));
    }
  }, [filtros.search, filtros.desde, filtros.hasta, filtros.pagina, alertasOriginal, aplicarFiltrosLocalDirecto, tipoAlertaPermitido, filtros.limite]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const handleLimpiarBusqueda = () => {
    setSearchInput('');
    setFiltros(prev => ({ ...prev, search: '', pagina: 1 }));
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

  const handleRowClick = useCallback(async (alerta) => {
    if (detalleAbortControllerRef.current) {
      detalleAbortControllerRef.current.abort();
      console.log('🛑 Petición de detalle anterior cancelada');
    }
    
    detalleAbortControllerRef.current = new AbortController();
    
    setDetalleLoading(true);
    try {
      const response = await alertasPanelService.obtenerDetalle(alerta.id, {
        signal: detalleAbortControllerRef.current.signal
      });
      
      if (response.success) {
        setDatosCompletosAlerta(response.data);
        
        if (response.requiere_otp) {
          setAlertaSeleccionada(alerta);
          setMostrarModalOtp(true);
        } else {
          navigate(`/admin/alertas/expiradas/${alerta.id}`);
        }
      } else {
        toast.error('Error al cargar la alerta');
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error al cargar detalle:', error);
        toast.error('Error al cargar la alerta');
      }
    } finally {
      setDetalleLoading(false);
    }
  }, [navigate]);

  const handleSolicitarOtp = async () => {
    if (!alertaSeleccionada) return;
    const result = await solicitarOtp(alertaSeleccionada.id);
    if (result.success) {
      setMostrarModalOtp(false);
    }
  };

  const handleVerificarOtpYVerDetalle = async () => {
    if (!alertaSeleccionada || !codigoOtp) return;
    const result = await verificarOtp(alertaSeleccionada.id, codigoOtp);
    if (result.success && result.data) {
      navigate(`/admin/alertas/expiradas/${alertaSeleccionada.id}`, { 
        state: { datosCompletos: result.data } 
      });
    }
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

  // ✅ Efecto para cargar datos al montar
  useEffect(() => {
    cargarAlertas();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente AlertasExpiradas desmontado - peticiones canceladas');
      }
      if (detalleAbortControllerRef.current) {
        detalleAbortControllerRef.current.abort();
        console.log('🛑 Petición de detalle cancelada');
      }
    };
  }, [cargarAlertas]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    try {
      const f = new Date(fecha);
      if (isNaN(f.getTime())) return 'Fecha inválida';
      return f.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '—';
    }
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
                onClick={limpiarFiltros}
                className="flex-1 px-3 sm:px-4 py-2 border border-slate-200 bg-white rounded-lg md:rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {(filtros.desde || filtros.hasta || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></span>
              <span className="text-gray-600">Filtros activos - {paginacion.total} resultados</span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {detalleLoading ? (
            <div className="p-8 md:p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-gray-600"></div>
              <p className="mt-3 text-xs sm:text-sm text-slate-500">Cargando detalles...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-8 md:p-16 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={24} className="md:w-7 md:h-7 text-slate-400" />
              </div>
              <h3 className="text-sm md:text-base font-medium text-slate-700 mb-1">No hay alertas expiradas</h3>
              <p className="text-xs text-slate-400">
                {filtros.search || filtros.desde || filtros.hasta
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'Todas las alertas han sido atendidas a tiempo'}
                {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
              {(filtros.search || filtros.desde || filtros.hasta) && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  Limpiar filtros
                </button>
              )}
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
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id} 
                        onClick={() => handleRowClick(alerta)}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginacion.total_paginas > 1 && (
                <div className="px-4 md:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-slate-600">
                    Mostrando <span className="font-medium">{inicio}</span> a{' '}
                    <span className="font-medium">{fin}</span> de{' '}
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
                      Página {paginacion.pagina} de {paginacion.total_paginas}
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal del Mapa */}
      <ModalMapa
        isOpen={mapaModal.abierto}
        onClose={cerrarMapaModal}
        lat={mapaModal.lat}
        lng={mapaModal.lng}
        titulo={mapaModal.titulo}
        alertaId={mapaModal.alertaId}
        tipo={mapaModal.tipo}
      />

      {/* MODAL DE SOLICITUD DE OTP */}
      {mostrarModalOtp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <Shield className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                Verificación de seguridad
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Para ver los datos completos de esta alerta, necesitas solicitar un código de verificación.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                El código será enviado a tu correo electrónico.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setMostrarModalOtp(false);
                  setAlertaSeleccionada(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSolicitarOtp}
                disabled={solicitando}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {solicitando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock size={18} />
                )}
                Solicitar código
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INGRESO DE OTP */}
      {showModalHook && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center mb-4">
              <Shield className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                Ingresa el código de verificación
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Se ha enviado un código a:
              </p>
              <p className="font-medium text-gray-700">{otpEmail}</p>
              {otpExpiracion && (
                <p className="text-xs text-gray-400 mt-1">
                  Válido hasta: {new Date(otpExpiracion).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={cerrarModalOtpHook}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerificarOtpYVerDetalle}
                disabled={verificando || codigoOtp.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {verificando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Verificar y ver detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasExpiradas;