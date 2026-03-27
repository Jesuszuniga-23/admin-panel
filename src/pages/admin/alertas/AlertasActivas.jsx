// src/pages/admin/alertas/AlertasActivas.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Filter, Calendar, ChevronLeft, ChevronRight,
  Eye, Clock, MapPin, User, Phone, Shield, Lock, CheckCircle
} from 'lucide-react';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import Loader from '../../../components/common/Loader';
import { BadgeTipoAlerta, BotonMapa, ModalMapa } from '../../../components/ui/IconoEntidad';
import toast from 'react-hot-toast';
import authService from '../../../services/auth.service';
import useAuthStore from '../../../store/authStore';
import { useOtp } from '../../../hooks/useOtp';

// Función para normalizar texto (mantener igual)
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

const AlertasActivas = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [alertas, setAlertas] = useState([]);
  const [alertasOriginal, setAlertasOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalleLoading, setDetalleLoading] = useState(false); // ✅ Estado separado para detalle
  
  // ✅ REF para AbortController (principal)
  const abortControllerRef = useRef(null);
  
  // ✅ REF para AbortController de detalle
  const detalleAbortControllerRef = useRef(null);
  
  // Obtener tipo de alerta permitido según rol
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  // ✅ Eliminada variable no usada 'puedeGestionar'
  
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

  // ✅ Función para cargar alertas con AbortController
  const cargarAlertas = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en AlertasActivas');
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const params = {};
      if (tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
      }
      
      const response = await alertasPanelService.listarActivas({ 
        limite: 1000, 
        ...params,
        signal: abortControllerRef.current.signal 
      });
      
      if (response.success) {
        const alertasFormateadas = (response.data || []).map(alerta => ({
          ...alerta,
          ciudadano: alerta.ciudadano ? {
            ...alerta.ciudadano,
            nombre: formatearNombre(alerta.ciudadano.nombre)
          } : null
        }));
        
        setAlertasOriginal(alertasFormateadas);
        aplicarFiltrosLocal(alertasFormateadas);
      } else {
        setAlertas([]);
      }
    } catch (error) {
      // ✅ Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error:', error);
        toast.error('Error al cargar alertas');
      }
    } finally {
      setLoading(false);
    }
  }, [tipoAlertaPermitido]);

  const aplicarFiltrosLocal = (datos = alertasOriginal) => {
    let datosFiltrados = datos;

    if (filtros.desde && filtros.hasta) {
      datosFiltrados = datos.filter(item => {
        const fechaCreacion = new Date(item.fecha_creacion);
        
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
        
        return fechaCreacion >= desde && fechaCreacion <= hasta;
      });
    }

    const total = datosFiltrados.length;
    const totalPaginas = Math.ceil(total / filtros.limite);
    const inicio = (filtros.pagina - 1) * filtros.limite;
    const fin = inicio + filtros.limite;
    const datosPaginados = datosFiltrados.slice(inicio, fin);
    
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
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  useEffect(() => {
    if (alertasOriginal.length) {
      aplicarFiltrosLocal();
    }
  }, [filtros.desde, filtros.hasta, filtros.pagina, alertasOriginal]);

  // ✅ Cargar datos al montar y limpiar al desmontar
  useEffect(() => {
    cargarAlertas();
    
    // ✅ LIMPIAR al desmontar el componente
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente AlertasActivas desmontado - peticiones canceladas');
      }
      if (detalleAbortControllerRef.current) {
        detalleAbortControllerRef.current.abort();
        console.log('🛑 Petición de detalle cancelada');
      }
    };
  }, [cargarAlertas]);

  // ✅ Manejar clic en alerta con AbortController
  const handleRowClick = useCallback(async (alerta) => {
    // Cancelar petición de detalle anterior si existe
    if (detalleAbortControllerRef.current) {
      detalleAbortControllerRef.current.abort();
      console.log('🛑 Petición de detalle anterior cancelada');
    }
    
    // Crear nuevo AbortController para detalle
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
      // ✅ Ignorar errores de cancelación
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

  const calcularTiempoEspera = (fechaCreacion) => {
    if (!fechaCreacion) return 'N/A';
    const minutos = Math.floor((new Date() - new Date(fechaCreacion)) / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * filtros.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * filtros.limite, paginacion.total);

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
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-xl shadow-lg shadow-red-200">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Alertas Activas</h1>
              <p className="text-sm text-gray-500 mt-1">
                {paginacion.total} {paginacion.total === 1 ? 'alerta espera' : 'alertas esperan'} ser atendidas
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

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-gray-700">Filtros por fecha</span>
            {(filtros.desde || filtros.hasta) && (
              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full ml-2">
                {paginacion.total} resultados
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
                  onChange={(e) => handleFechaChange('desde', e.target.value)}
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
                  onChange={(e) => handleFechaChange('hasta', e.target.value)}
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

        {/* Tabla de Alertas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {detalleLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-200 border-t-red-600"></div>
              <p className="mt-3 text-sm text-gray-500">Cargando detalles...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay alertas activas</h3>
              <p className="text-sm text-gray-400">
                {filtros.desde || filtros.hasta
                  ? `No se encontraron alertas entre ${formatearFechaCorta(filtros.desde)} y ${formatearFechaCorta(filtros.hasta)}`
                  : 'Todas las alertas han sido atendidas o asignadas'}
                {tipoAlertaPermitido && ` (Filtro: ${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIPO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIUDADANO</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UBICACIÓN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TIEMPO ESPERA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">FECHA</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertas.map((alerta) => (
                      <tr 
                        key={alerta.id}
                        onClick={() => handleRowClick(alerta)}
                        className="hover:bg-red-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">#{alerta.id}</td>
                        <td className="px-4 py-3">
                          <BadgeTipoAlerta tipo={alerta.tipo} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {alerta.ciudadano?.nombre || 'Desconocido'}
                            </span>
                            {alerta.ciudadano?.telefono && (
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />
                                {alerta.ciudadano.telefono}
                              </span>
                            )}
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
                            <Clock size={14} className="text-amber-500" />
                            <span className="text-sm font-semibold text-amber-600">
                              {calcularTiempoEspera(alerta.fecha_creacion)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatearFechaCorta(alerta.fecha_creacion)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(alerta);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <Eye size={16} className="text-gray-500" />
                          </button>
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

export default AlertasActivas;