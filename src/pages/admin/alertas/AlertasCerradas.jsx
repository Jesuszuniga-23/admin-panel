// src/pages/admin/alertas/AlertasCerradas.jsx (CORREGIDO - ORDEN DESCENDENTE)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Filter, Calendar, ChevronLeft, ChevronRight,
  Eye, Clock, MapPin, User, Phone, Search, X, AlertTriangle,
  Shield, Lock
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import { BadgeTipoAlerta, BotonMapa, ModalMapa } from '../../../components/ui/IconoEntidad';
import toast from 'react-hot-toast';
import authService from '../../../services/auth.service';
import { useOtp } from '../../../hooks/useOtp';

// Función para normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';
  
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
    { de: '¡', para: 'í' }, { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
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

const calcularTiempoAtencionMinutos = (creacion, cierre) => {
  if (!creacion || !cierre) return null;
  return Math.round((new Date(cierre) - new Date(creacion)) / 60000);
};

const formatearTiempoAtencion = (creacion, cierre) => {
  const minutos = calcularTiempoAtencionMinutos(creacion, cierre);
  if (minutos === null) return 'N/A';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h ${mins}m`;
};

const AlertasCerradas = () => {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [tiempoMinimo, setTiempoMinimo] = useState('');
  const [tiempoMaximo, setTiempoMaximo] = useState('');
  
  // REF para AbortControllers
  const abortControllerRef = useRef(null);
  const detalleAbortControllerRef = useRef(null);
  
  // Obtener tipo de alerta permitido según rol
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  // Estados para el modal OTP
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [mostrarModalOtp, setMostrarModalOtp] = useState(false);
  const [datosCompletosAlerta, setDatosCompletosAlerta] = useState(null);
  const [codigoOtp, setCodigoOtp] = useState('');
  
  // Hook OTP
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

  // ✅ Cargar alertas desde el backend
  const cargarAlertas = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en AlertasCerradas');
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const params = { 
        limite: 1000,
        signal: abortControllerRef.current.signal 
      };
      
      // ✅ APLICAR FILTRO DE SEGURIDAD como whereExtra
      if (tipoAlertaPermitido) {
        params.whereExtra = { tipo: tipoAlertaPermitido };
      }
      
      const response = await alertasPanelService.obtenerCerradas(params);

      if (response.success) {
        const alertasFormateadas = (response.data || []).map(alerta => ({
          ...alerta,
          ciudadano: alerta.ciudadano ? {
            ...alerta.ciudadano,
            nombre: formatearNombre(alerta.ciudadano.nombre)
          } : null,
          tiempoAtencionMinutos: calcularTiempoAtencionMinutos(alerta.fecha_asignacion, alerta.fecha_cierre)
        }));

        setAlertasOriginal(alertasFormateadas);
        aplicarFiltrosLocal(alertasFormateadas);
      } else {
        setAlertas([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error:', error);
        toast.error('Error al cargar alertas');
      }
    } finally {
      setLoading(false);
    }
  }, [tipoAlertaPermitido]);

  // ✅ FUNCIÓN CORREGIDA - CON ORDEN DESCENDENTE POR FECHA DE CIERRE
  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    // Crear una copia para no mutar el array original
    let datosFiltrados = [...datos];

    // 1. FILTRO POR RANGO DE FECHAS
    if (filtros.desde && filtros.hasta) {
      datosFiltrados = datosFiltrados.filter(item => {
        const fechaCierre = new Date(item.fecha_cierre);

        const desdeParts = filtros.desde.split('-');
        const hastaParts = filtros.hasta.split('-');

        const desde = new Date(
          parseInt(desdeParts[0]),
          parseInt(desdeParts[1]) - 1,
          parseInt(desdeParts[2]),
          0, 0, 0, 0
        );

        const hasta = new Date(
          parseInt(hastaParts[0]),
          parseInt(hastaParts[1]) - 1,
          parseInt(hastaParts[2]),
          23, 59, 59, 999
        );

        return fechaCierre >= desde && fechaCierre <= hasta;
      });
    }

    // 2. FILTRO POR TIPO DE ALERTA
    if (tipoFiltro !== 'todos') {
      datosFiltrados = datosFiltrados.filter(item => item.tipo === tipoFiltro);
    }

    // 3. FILTRO POR BÚSQUEDA (nombre o teléfono)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      datosFiltrados = datosFiltrados.filter(item => 
        item.ciudadano?.nombre?.toLowerCase().includes(term) ||
        item.ciudadano?.telefono?.includes(term)
      );
    }

    // 4. FILTRO POR TIEMPO MÍNIMO DE ATENCIÓN
    if (tiempoMinimo) {
      datosFiltrados = datosFiltrados.filter(item => 
        item.tiempoAtencionMinutos !== null && 
        item.tiempoAtencionMinutos >= parseInt(tiempoMinimo)
      );
    }
    
    // 5. FILTRO POR TIEMPO MÁXIMO DE ATENCIÓN
    if (tiempoMaximo) {
      datosFiltrados = datosFiltrados.filter(item => 
        item.tiempoAtencionMinutos !== null && 
        item.tiempoAtencionMinutos <= parseInt(tiempoMaximo)
      );
    }

    // ✅ 6. ORDENAR POR FECHA DE CIERRE: MÁS RECIENTES PRIMERO (HOY → AYER → ANTIGUAS)
    datosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha_cierre);
      const fechaB = new Date(b.fecha_cierre);
      return fechaB - fechaA; // DESCENDENTE: más reciente primero
    });

    // 7. PAGINACIÓN
    const total = datosFiltrados.length;
    const totalPaginas = Math.ceil(total / filtros.limite);
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);

    // 8. ACTUALIZAR ESTADOS
    setAlertas(datosPaginados);
    setPaginacion({
      total,
      pagina: filtros.pagina,
      total_paginas: totalPaginas
    });
  };

  const handleFechaChange = (tipo, valor) => {
    setFiltros(prev => ({ ...prev, [tipo]: valor, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      desde: '',
      hasta: '',
      pagina: 1,
      limite: 10
    });
    setSearchTerm('');
    setTipoFiltro('todos');
    setTiempoMinimo('');
    setTiempoMaximo('');
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  // ✅ Efecto para re-aplicar filtros cuando cambian
  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal(alertasOriginal);
    }
  }, [filtros.desde, filtros.hasta, filtros.pagina, searchTerm, tipoFiltro, tiempoMinimo, tiempoMaximo]);

  // ✅ Efecto para cargar datos al montar
  useEffect(() => {
    cargarAlertas();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente AlertasCerradas desmontado - peticiones canceladas');
      }
      if (detalleAbortControllerRef.current) {
        detalleAbortControllerRef.current.abort();
        console.log('🛑 Petición de detalle cancelada');
      }
    };
  }, [cargarAlertas]);

  // Manejar clic en alerta con AbortController
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
          navigate(`/admin/alertas/${alerta.id}`);
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
      navigate(`/admin/alertas/${alertaSeleccionada.id}`, { 
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

  const formatearFechaCorta = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * filtros.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * filtros.limite, paginacion.total);

  const tieneFiltrosActivos = () => {
    return filtros.desde || filtros.hasta || searchTerm || tipoFiltro !== 'todos' || tiempoMinimo || tiempoMaximo;
  };

  if (loading && alertas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg shadow-green-200">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Cerradas</h1>
              <p className="text-sm text-gray-500 mt-1">
                {paginacion.total} {paginacion.total === 1 ? 'alerta atendida' : 'alertas atendidas'}
                {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
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

        {/* Buscador y Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
          <div className="relative mb-5">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de ciudadano o teléfono..."
              className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros avanzados</span>
            {tieneFiltrosActivos() && (
              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full ml-2">
                {paginacion.total} resultados
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de alerta</label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                disabled={!!tipoAlertaPermitido}
              >
                <option value="todos">Todos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.desde}
                  onChange={(e) => handleFechaChange('desde', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={filtros.hasta}
                  onChange={(e) => handleFechaChange('hasta', e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tiempo atención (min)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={tiempoMinimo}
                  onChange={(e) => setTiempoMinimo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                />
                <span className="text-gray-400 self-center">-</span>
                <input
                  type="number"
                  placeholder="Máximo"
                  value={tiempoMaximo}
                  onChange={(e) => setTiempoMaximo(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={limpiarFiltros}
                className="w-full px-6 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-600 flex items-center justify-center gap-2"
              >
                <X size={14} />
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Alertas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {detalleLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-3 text-sm text-gray-500">Cargando detalles...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay alertas cerradas</h3>
              <p className="text-sm text-gray-400">
                {tieneFiltrosActivos()
                  ? 'No se encontraron alertas con los filtros seleccionados'
                  : 'Las alertas atendidas aparecerán aquí'}
                {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIPO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIUDADANO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UBICACIÓN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIEMPO ATENCIÓN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">FECHA CIERRE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id}
                        onClick={() => handleRowClick(alerta)}
                        className="hover:bg-green-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <BadgeTipoAlerta tipo={alerta.tipo} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {alerta.lat && alerta.lng ? (
                            <BotonMapa
                              onClick={(e) => abrirMapaModal(e, alerta)}
                              texto="Ver mapa"
                              size={14}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-green-600" />
                            <span className="text-sm font-semibold text-green-600">
                              {formatearTiempoAtencion(alerta.fecha_asignacion, alerta.fecha_cierre)}
                            </span>
                            {alerta.tiempoAtencionMinutos !== null && (
                              <span className="text-xs text-gray-400">
                                ({alerta.tiempoAtencionMinutos} min)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatearFechaCorta(alerta.fecha_cierre)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {paginacion.total_paginas > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-gray-500">
                    Mostrando <span className="font-medium">{inicio}</span> a{' '}
                    <span className="font-medium">{fin}</span> de{' '}
                    <span className="font-medium">{paginacion.total}</span> alertas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarPagina(paginacion.pagina - 1)}
                      disabled={paginacion.pagina === 1}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>
                    
                    <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                      Página {paginacion.pagina} de {paginacion.total_paginas}
                    </span>
                    
                    <button
                      onClick={() => cambiarPagina(paginacion.pagina + 1)}
                      disabled={paginacion.pagina === paginacion.total_paginas}
                      className="px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
                    >
                      Siguiente
                      <ChevronRight size={16} />
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

export default AlertasCerradas;