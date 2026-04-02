import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Power, Users, X, FileSpreadsheet, FilePieChart,
  Clock, AlertCircle, CheckCircle, Loader
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import reportesService from '../../../services/admin/reportes.service';
import useAuthStore from '../../../store/authStore';
import authService from '../../../services/auth.service';
import IconoEntidad, { BadgeIcono } from '../../../components/ui/IconoEntidad';

const capitalizar = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

const tipoToEntidad = {
  patrulla: 'PATRULLA',
  ambulancia: 'AMBULANCIA'
};

const ModalAccionNoPermitida = ({ isOpen, onClose, mensaje }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Acción no permitida</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">{mensaje}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalConfirmacion = ({ isOpen, onClose, onConfirm, titulo, mensaje, itemNombre, tipoAccion = 'eliminar', loading }) => {
  if (!isOpen) return null;

  const config = {
    eliminar: {
      icon: <Trash2 size={24} className="text-red-600" />,
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Eliminar',
      mensajeAdicional: 'Esta acción no se puede deshacer.'
    },
    desactivar: {
      icon: <Power size={24} className="text-yellow-600" />,
      bgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      buttonText: 'Desactivar',
      mensajeAdicional: 'La unidad dejará de recibir alertas y no estará operativa.'
    },
    activar: {
      icon: <CheckCircle size={24} className="text-green-600" />,
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Activar',
      mensajeAdicional: 'La unidad volverá a estar operativa y podrá recibir alertas.'
    }
  };

  const conf = config[tipoAccion] || config.eliminar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 ${conf.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              {conf.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{titulo || 'Confirmar acción'}</h3>
          </div>

          <p className="text-sm text-gray-600 mb-2">{mensaje}</p>
          {itemNombre && (
            <p className="text-base font-semibold text-center p-3 rounded-lg mb-4" style={{
              color: tipoAccion === 'eliminar' ? '#dc2626' :
                tipoAccion === 'desactivar' ? '#d97706' : '#059669',
              backgroundColor: tipoAccion === 'eliminar' ? '#fee2e2' :
                tipoAccion === 'desactivar' ? '#fef3c7' : '#d1fae5'
            }}>
              "{itemNombre}"
            </p>
          )}
          <p className="text-xs text-gray-400 mb-6">{conf.mensajeAdicional}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={loading}
              className={`px-4 py-2 ${conf.buttonColor} text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50`}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : conf.icon}
              {loading ? 'Procesando...' : conf.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnidadesList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const abortControllerRef = useRef(null);

  const tipoUnidadPermitido = authService.getTipoUnidadPermitido();

  const puedeCrearUnidades = useCallback(() => {
    const puedeCrearPatrulla = authService.puedeCrearUnidad('patrulla');
    const puedeCrearAmbulancia = authService.puedeCrearUnidad('ambulancia');
    return puedeCrearPatrulla || puedeCrearAmbulancia;
  }, []);

  const puedeGestionarUnidad = useCallback((unidad) => {
    return authService.puedeEditarUnidad(unidad.tipo);
  }, []);

  const puedeEliminarUnidad = useCallback((unidad) => {
    return authService.puedeEliminarUnidad(unidad.tipo);
  }, []);

  const [modalInfo, setModalInfo] = useState({ show: false, mensaje: '' });
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    id: null,
    codigo: '',
    unidad: null,
    tipoAccion: 'eliminar'
  });
  const [modalToggle, setModalToggle] = useState({
    show: false,
    id: null,
    codigo: '',
    unidad: null,
    activar: false,
    estadoActual: null
  });

  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    search: '',
    pagina: 1,
    limite: 10
  });
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  const { value: searchTerm } = useDebounce(filtros.search, 500);

  // ✅ CORRECCIÓN CRÍTICA: Aplicar filtro de seguridad con prioridad
  const cargarUnidades = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en UnidadesList');
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const filtrosActivos = { signal: abortControllerRef.current.signal };

      // ✅ APLICAR FILTRO DE SEGURIDAD PRIMERO
      if (tipoUnidadPermitido) {
        filtrosActivos.tipo = tipoUnidadPermitido;
        console.log('🔒 [UnidadesList] Filtro de seguridad aplicado:', tipoUnidadPermitido);
      }
      // ✅ LUEGO APLICAR FILTRO DEL USUARIO SI CORRESPONDE
      else if (filtros.tipo && filtros.tipo !== '') {
        filtrosActivos.tipo = filtros.tipo;
      }

      if (filtros.estado && filtros.estado !== '') {
        filtrosActivos.estado = filtros.estado;
      }

      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
        filtrosActivos.search = searchTerm;
      }

      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;

      console.log('🔍 [UnidadesList] tipoUnidadPermitido:', tipoUnidadPermitido);
      console.log('🔍 [UnidadesList] filtrosActivos enviados:', filtrosActivos);

      const response = await unidadService.listarUnidades(filtrosActivos);
      setUnidades(response.data || []);
      setPaginacion(response.paginacion || {
        total: response.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: 1
      });

      console.log('📊 [UnidadesList] Total de registros:', response.paginacion?.total || response.data?.length || 0);

    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error:', error);
        if (error.response?.status === 429) {
          toast.error('Demasiadas peticiones. Espera unos segundos...', {
            icon: <Clock size={18} className="text-yellow-500" />
          });
        } else {
          toast.error('Error al cargar unidades');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [filtros.tipo, filtros.estado, searchTerm, filtros.pagina, filtros.limite, tipoUnidadPermitido]);  // ✅ CIERRE CORRECTO

  useEffect(() => {
    cargarUnidades();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente UnidadesList desmontado - peticiones canceladas');
      }
    };
  }, [cargarUnidades]);

  const isUnidadOcupada = (unidad) => {
    return unidad.estado === 'ocupada';
  };

  const exportarExcel = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte de Excel...', { id: 'export' });
      const params = {};
      if (tipoUnidadPermitido) params.tipo = tipoUnidadPermitido;
      const response = await unidadService.listarUnidades({ limite: 1000, ...params });
      const todasUnidades = response.data || [];
      await reportesService.generarExcelPersonalizado(todasUnidades, 'unidades', filtros, user);
      toast.success('Reporte de Excel generado correctamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al generar reporte de Excel', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte PDF...', { id: 'export' });
      const params = {};
      if (tipoUnidadPermitido) params.tipo = tipoUnidadPermitido;
      const response = await unidadService.listarUnidades({ limite: 1000, ...params });
      const todasUnidades = response.data || [];
      await reportesService.generarPDFPersonalizado(todasUnidades, 'unidades', filtros, user);
      toast.success('Reporte PDF generado correctamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar reporte PDF', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  const handleToggleActivo = async (id, codigo, unidad) => {
    if (!puedeGestionarUnidad(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No tienes permisos para modificar esta unidad.`
      });
      return;
    }

    if (isUnidadOcupada(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No es posible ${unidad.activa ? 'desactivar' : 'activar'} la unidad "${codigo}" porque se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    setModalToggle({
      show: true,
      id,
      codigo,
      unidad,
      activar: !unidad.activa,
      estadoActual: unidad.activa
    });
  };

  const ejecutarToggle = async () => {
    const { id, codigo, unidad, activar } = modalToggle;
    const accion = activar ? 'activar' : 'desactivar';
    const estadoAnterior = unidades.find(u => u.id === id);
    const activa = unidad.activa;

    setActionLoading(true);
    setUnidades(prevUnidades =>
      prevUnidades.map(u =>
        u.id === id
          ? { ...u, activa: activar, estado: activar ? 'disponible' : 'inactiva' }
          : u
      )
    );

    try {
      const response = await unidadService.toggleActiva(id, activar);
      if (response.data?.estado) {
        setUnidades(prevUnidades =>
          prevUnidades.map(u =>
            u.id === id
              ? { ...u, estado: response.data.estado, activa: response.data.activa }
              : u
          )
        );
      }
      toast.success(`Unidad ${accion}da correctamente`, {
        icon: <Power size={18} className={activar ? 'text-green-500' : 'text-yellow-500'} />
      });
    } catch (error) {
      setUnidades(prevUnidades =>
        prevUnidades.map(u =>
          u.id === id
            ? { ...u, activa: estadoAnterior.activa, estado: estadoAnterior.estado }
            : u
        )
      );
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error(error.error || `Error al ${accion} unidad`);
      }
    } finally {
      setActionLoading(false);
      setModalToggle({ show: false, id: null, codigo: '', unidad: null, activar: false, estadoActual: null });
    }
  };

  const handleEliminar = async (id, codigo, unidad) => {
    if (!puedeEliminarUnidad(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No tienes permisos para eliminar esta unidad.`
      });
      return;
    }

    if (isUnidadOcupada(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No es posible eliminar la unidad "${codigo}" porque se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    setModalConfirmacion({
      show: true,
      id,
      codigo,
      unidad,
      tipoAccion: 'eliminar'
    });
  };

  const ejecutarEliminar = async () => {
    const { id, codigo } = modalConfirmacion;
    setActionLoading(true);
    try {
      await unidadService.eliminarUnidad(id);
      toast.success('Unidad eliminada correctamente');
      await cargarUnidades();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error(error.error || 'Error al eliminar');
      }
    } finally {
      setActionLoading(false);
      setModalConfirmacion({ show: false, id: null, codigo: '', unidad: null, tipoAccion: 'eliminar' });
    }
  };

  const handleVerDetalle = (id) => {
    navigate(`/admin/unidades/${id}`);
  };

  const handleEditar = (id, unidad) => {
    if (!puedeGestionarUnidad(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No tienes permisos para editar esta unidad.`
      });
      return;
    }

    if (isUnidadOcupada(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No es posible editar la unidad "${unidad.codigo}" porque se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }
    navigate(`/admin/unidades/editar/${id}`);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      search: '',
      pagina: 1,
      limite: 10
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <ModalAccionNoPermitida
        isOpen={modalInfo.show}
        onClose={() => setModalInfo({ show: false, mensaje: '' })}
        mensaje={modalInfo.mensaje}
      />

      <ModalConfirmacion
        isOpen={modalConfirmacion.show}
        onClose={() => setModalConfirmacion({ show: false, id: null, codigo: '', unidad: null, tipoAccion: 'eliminar' })}
        onConfirm={ejecutarEliminar}
        titulo="Confirmar eliminación"
        mensaje="¿Estás seguro de eliminar la unidad?"
        itemNombre={modalConfirmacion.codigo}
        tipoAccion="eliminar"
        loading={actionLoading}
      />

      <ModalConfirmacion
        isOpen={modalToggle.show}
        onClose={() => setModalToggle({ show: false, id: null, codigo: '', unidad: null, activar: false, estadoActual: null })}
        onConfirm={ejecutarToggle}
        titulo={modalToggle.activar ? "Confirmar activación" : "Confirmar desactivación"}
        mensaje={modalToggle.activar
          ? "¿Estás seguro de activar la unidad?"
          : "¿Estás seguro de desactivar la unidad?"}
        itemNombre={modalToggle.codigo}
        tipoAccion={modalToggle.activar ? "activar" : "desactivar"}
        loading={actionLoading}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-purple-200">
            <Truck size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Unidades</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Gestión de unidades operativas
              {tipoUnidadPermitido && ` (${tipoUnidadPermitido === 'patrulla' ? 'Solo Patrullas' : 'Solo Ambulancias'})`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportarExcel}
            disabled={exportando || actionLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {exportando ? <Loader size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            <span className="sm:hidden">Excel</span>
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando || actionLoading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {exportando ? <Loader size={16} className="animate-spin" /> : <FilePieChart size={16} />}
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">PDF</span>
          </button>
          {puedeCrearUnidades() && (
            <button
              onClick={() => navigate('/admin/unidades/crear')}
              disabled={actionLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus size={16} />
              <span className="sm:hidden">Nueva</span>
              <span className="hidden sm:inline">Nueva Unidad</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Filter size={14} className="sm:w-4 sm:h-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Filtros</h2>
          </div>
          {(filtros.tipo || filtros.estado || filtros.search) && (
            <button onClick={limpiarFiltros} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <X size={12} />
              <span className="hidden xs:inline">Limpiar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <div className="xs:col-span-2 lg:col-span-2 relative">
            <Search size={14} className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar código o descripción..."
              value={filtros.search}
              onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value, pagina: 1 }))}
              className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value, pagina: 1 }))}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={!!tipoUnidadPermitido}
          >
            <option value="">Todos los tipos</option>
            <option value="patrulla">Patrulla</option>
            <option value="ambulancia">Ambulancia</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value, pagina: 1 }))}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="inactiva">Inactiva</option>
          </select>

          <div className="flex gap-2 xs:col-span-2 lg:col-span-1">
            <button
              onClick={() => setFiltros(prev => ({ ...prev, pagina: 1 }))}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>

        {(filtros.tipo || filtros.estado || filtros.search) && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-blue-600 font-medium">Filtros activos - {paginacion.total} resultados</span>
          </div>
        )}

        {tipoUnidadPermitido && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-600 font-medium">
              Filtro de seguridad activo: Mostrando solo {tipoUnidadPermitido === 'patrulla' ? 'Patrullas' : 'Ambulancias'}
            </span>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">Cargando unidades...</p>
          </div>
        ) : unidades.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Truck size={36} className="sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 sm:mb-2">No hay unidades registradas</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              {tipoUnidadPermitido
                ? `No hay unidades de tipo ${tipoUnidadPermitido === 'patrulla' ? 'Patrulla' : 'Ambulancia'} registradas`
                : 'Comienza creando una nueva unidad'}
            </p>
            {puedeCrearUnidades() && !tipoUnidadPermitido && (
              <button
                onClick={() => navigate('/admin/unidades/crear')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                Nueva Unidad
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] lg:min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Personal</th>
                    <th className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {unidades.map((unidad) => (
                    <tr key={unidad.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <IconoEntidad
                            entidad={tipoToEntidad[unidad.tipo] || 'PATRULLA'}
                            size={16}
                          />
                          <span className="text-xs sm:text-sm font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[120px]">
                            {unidad.codigo}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <BadgeIcono
                          entidad={tipoToEntidad[unidad.tipo] || 'PATRULLA'}
                          texto={unidad.tipo === 'patrulla' ? 'Patrulla' : 'Ambulancia'}
                          size={12}
                        />
                      </td>

                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs whitespace-nowrap ${unidad.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                            unidad.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {capitalizar(unidad.estado)}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {unidad.personal_asignado?.length || 0}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5 lg:gap-2">
                          {puedeGestionarUnidad(unidad) && (
                            <button
                              onClick={() => handleToggleActivo(unidad.id, unidad.codigo, unidad)}
                              disabled={actionLoading}
                              className={`p-1 rounded-lg transition-colors ${unidad.activa ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'
                                } disabled:opacity-50`}
                              title={unidad.activa ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleVerDetalle(unidad.id)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                            title="Ver detalles"
                          >
                            <Eye size={14} className="text-gray-500" />
                          </button>

                          {puedeGestionarUnidad(unidad) && (
                            <button
                              onClick={() => handleEditar(unidad.id, unidad)}
                              className="p-1 hover:bg-gray-100 rounded-lg"
                              title="Editar"
                            >
                              <Edit size={14} className="text-gray-500" />
                            </button>
                          )}

                          {puedeEliminarUnidad(unidad) && (
                            <button
                              onClick={() => handleEliminar(unidad.id, unidad.codigo, unidad)}
                              disabled={actionLoading}
                              className="p-1 hover:bg-red-50 rounded-lg disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t flex flex-col xs:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500 text-center xs:text-left">
                Mostrando <span className="font-medium">{inicio}</span> a{' '}
                <span className="font-medium">{fin}</span>{' '}
                de <span className="font-medium">{paginacion.total}</span> registros
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: Math.max(1, prev.pagina - 1) }))}
                  disabled={paginacion.pagina === 1 || actionLoading || loading}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600">
                  {paginacion.pagina} / {Math.max(1, paginacion.total_paginas)}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: Math.min(paginacion.total_paginas, prev.pagina + 1) }))}
                  disabled={paginacion.pagina >= paginacion.total_paginas || actionLoading || loading || paginacion.total === 0}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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


export default UnidadesList;