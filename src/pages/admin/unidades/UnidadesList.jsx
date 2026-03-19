import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Power, RotateCcw, Shield, Ambulance,
  MapPin, Users, MoreVertical, Download, AlertCircle, X,
  Clock, FileSpreadsheet, FilePieChart, AlertTriangle, CheckCircle
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import ReporteBase from '../../../components/reportes/ReporteBase';
import reportesService from '../../../services/admin/reportes.service';
import useAuthStore from '../../../store/authStore';

// Función para capitalizar primera letra
const capitalizar = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

// Modal personalizado para mensajes de acción no permitida
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

// Modal de confirmación personalizado
const ModalConfirmacion = ({ isOpen, onClose, onConfirm, titulo, mensaje, itemNombre, tipoAccion = 'eliminar' }) => {
  if (!isOpen) return null;

  const config = {
    eliminar: {
      icon: <AlertTriangle size={24} className="text-red-600" />,
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      buttonIcon: <Trash2 size={16} />,
      buttonText: 'Eliminar',
      mensajeAdicional: 'Esta acción no se puede deshacer.'
    },
    desactivar: {
      icon: <Power size={24} className="text-yellow-600" />,
      bgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      buttonIcon: <Power size={16} />,
      buttonText: 'Desactivar',
      mensajeAdicional: 'La unidad dejará de recibir alertas y no estará operativa.'
    },
    activar: {
      icon: <CheckCircle size={24} className="text-green-600" />,
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonIcon: <Power size={16} />,
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
          
          <p className="text-sm text-gray-600 mb-2">
            {mensaje || `¿Estás seguro de ${tipoAccion === 'activar' ? 'activar' : tipoAccion === 'desactivar' ? 'desactivar' : 'eliminar'} la unidad`}
          </p>
          {itemNombre && (
            <p className="text-base font-semibold text-center p-2 rounded-lg mb-4" style={{
              color: tipoAccion === 'eliminar' ? '#dc2626' : tipoAccion === 'desactivar' ? '#d97706' : '#059669',
              backgroundColor: tipoAccion === 'eliminar' ? '#fee2e2' : tipoAccion === 'desactivar' ? '#fef3c7' : '#d1fae5'
            }}>
              "{itemNombre}"
            </p>
          )}
          <p className="text-xs text-gray-400 mb-6">{conf.mensajeAdicional}</p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 ${conf.buttonColor} text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2`}
            >
              {conf.buttonIcon}
              {conf.buttonText}
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
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [exportando, setExportando] = useState(false);
  
  // Estados para modales
  const [modalInfo, setModalInfo] = useState({
    show: false,
    mensaje: ''
  });
  
  // Estado para modal de confirmación de eliminación
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    id: null,
    codigo: '',
    unidad: null,
    tipoAccion: 'eliminar'
  });

  // 🔥 NUEVO: Estado para modal de confirmación de activar/desactivar
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
  const searchTerm = useDebounce(filtros.search, 500);

  const cargarUnidades = useCallback(async () => {
    setLoading(true);
    try {
      const filtrosActivos = {};
      if (filtros.tipo) filtrosActivos.tipo = filtros.tipo;
      if (filtros.estado) filtrosActivos.estado = filtros.estado;
      if (searchTerm) filtrosActivos.search = searchTerm;
      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;

      const response = await unidadService.listarUnidades(filtrosActivos);
      setUnidades(response.data || []);
      setPaginacion(response.paginacion || {
        total: response.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: 1
      });
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error('Error al cargar unidades');
      }
    } finally {
      setLoading(false);
    }
  }, [filtros.tipo, filtros.estado, searchTerm, filtros.pagina, filtros.limite]);

  useEffect(() => {
    cargarUnidades();
  }, [cargarUnidades]);

  // VALIDACIÓN: Unidad ocupada
  const isUnidadOcupada = (unidad) => {
    return unidad.estado === 'ocupada';
  };

  // =====================================================
  // FUNCIONES DE EXPORTACIÓN PROFESIONAL
  // =====================================================
  
  const exportarExcel = async () => {
    try {
      setExportando(true);
      toast.loading('Generando reporte de Excel...', { id: 'export' });
      
      const response = await unidadService.listarUnidades({ limite: 1000 });
      const todasUnidades = response.data || [];
      
      await reportesService.generarExcelPersonalizado(
        todasUnidades, 
        'unidades', 
        filtros, 
        user
      );
      
      toast.success('Reporte de Excel generado correctamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando Excel:', error);
      toast.error('Error al generar reporte de Excel', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    try {
      setExportando(true);
      toast.loading('Generando reporte PDF...', { id: 'export' });
      
      const response = await unidadService.listarUnidades({ limite: 1000 });
      const todasUnidades = response.data || [];
      
      reportesService.generarPDFPersonalizado(
        todasUnidades, 
        'unidades', 
        filtros, 
        user
      );
      
      toast.success('Reporte PDF generado correctamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar reporte PDF', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  // 🔥 MODIFICADO: Ahora usa el modal de confirmación para activar/desactivar
  const handleToggleActivo = async (id, codigo, unidad) => {
    if (isUnidadOcupada(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No es posible ${unidad.activa ? 'desactivar' : 'activar'} la unidad "${codigo}" porque se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    // Abrir modal de confirmación para activar/desactivar
    setModalToggle({
      show: true,
      id,
      codigo,
      unidad,
      activar: !unidad.activa,
      estadoActual: unidad.activa
    });
  };

  // 🔥 NUEVO: Función para ejecutar el toggle después de confirmar
  const ejecutarToggle = async () => {
    const { id, codigo, unidad, activar } = modalToggle;
    const accion = activar ? 'activar' : 'desactivar';
    const estadoAnterior = unidades.find(u => u.id === id);
    const activa = unidad.activa;

    // Optimistic update
    setUnidades(prevUnidades =>
      prevUnidades.map(u =>
        u.id === id
          ? {
            ...u,
            activa: activar,
            estado: activar ? 'disponible' : 'inactiva'
          }
          : u
      )
    );

    try {
      const response = await unidadService.toggleActiva(id, activar);

      if (response.data?.estado) {
        setUnidades(prevUnidades =>
          prevUnidades.map(u =>
            u.id === id
              ? {
                ...u,
                estado: response.data.estado,
                activa: response.data.activa
              }
              : u
          )
        );
      }

      toast.success(`Unidad ${accion}da correctamente`, {
        icon: <Power size={18} className={activar ? 'text-green-500' : 'text-yellow-500'} />
      });
    } catch (error) {
      // Revertir en caso de error
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
    }
  };

  // MANEJADOR PARA ELIMINAR
  const handleEliminar = async (id, codigo, unidad) => {
    if (isUnidadOcupada(unidad)) {
      setModalInfo({
        show: true,
        mensaje: `No es posible eliminar la unidad "${codigo}" porque se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    // Abrir modal de confirmación para eliminar
    setModalConfirmacion({
      show: true,
      id,
      codigo,
      unidad,
      tipoAccion: 'eliminar'
    });
  };

  // Función para ejecutar la eliminación después de confirmar
  const ejecutarEliminar = async () => {
    const { id, codigo } = modalConfirmacion;
    
    try {
      await unidadService.eliminarUnidad(id);
      toast.success('Unidad eliminada correctamente');
      cargarUnidades();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error(error.error || 'Error al eliminar');
      }
    }
  };

  const handleVerDetalle = (id, unidad) => {
    navigate(`/admin/unidades/${id}`);
  };

  const handleEditar = (id, unidad) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Modal de acción no permitida */}
      <ModalAccionNoPermitida
        isOpen={modalInfo.show}
        onClose={() => setModalInfo({ show: false, mensaje: '' })}
        mensaje={modalInfo.mensaje}
      />

      {/* Modal de confirmación para eliminar */}
      <ModalConfirmacion
        isOpen={modalConfirmacion.show}
        onClose={() => setModalConfirmacion({ show: false, id: null, codigo: '', unidad: null, tipoAccion: 'eliminar' })}
        onConfirm={ejecutarEliminar}
        titulo="Confirmar eliminación"
        mensaje="¿Estás seguro de eliminar la unidad?"
        itemNombre={modalConfirmacion.codigo}
        tipoAccion="eliminar"
      />

      {/* 🔥 NUEVO: Modal de confirmación para activar/desactivar */}
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
      />

      {/* Header - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-purple-200">
            <Truck size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Unidades</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Gestión de unidades operativas
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={exportarExcel}
            disabled={exportando}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            title="Exportar a Excel"
          >
            <FileSpreadsheet size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="sm:hidden">Excel</span>
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            title="Exportar a PDF"
          >
            <FilePieChart size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => navigate('/admin/unidades/crear')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="sm:hidden">Nueva</span>
            <span className="hidden sm:inline">Nueva Unidad</span>
          </button>
        </div>
      </div>

      {/* Filtros - COMPLETAMENTE RESPONSIVE */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Filter size={14} className="sm:w-4 sm:h-4 text-blue-600" />
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700">Filtros</h2>
          </div>
          {(filtros.tipo || filtros.estado || filtros.search) && (
            <button
              onClick={limpiarFiltros}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X size={12} />
              <span className="hidden xs:inline">Limpiar</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          {/* Buscador */}
          <div className="xs:col-span-2 lg:col-span-2 relative">
            <Search size={14} className="sm:w-4 sm:h-4 absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar código o descripción..."
              value={filtros.search}
              onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value, pagina: 1 }))}
              className="w-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Select tipo */}
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value, pagina: 1 }))}
            className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los tipos</option>
            <option value="policia">Policía</option>
            <option value="ambulancia">Ambulancia</option>
          </select>

          {/* Select estado */}
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

          {/* Botón Aplicar */}
          <div className="flex gap-2 xs:col-span-2 lg:col-span-1">
            <button
              onClick={() => setFiltros(prev => ({ ...prev, pagina: 1 }))}
              className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Indicador de filtros activos */}
        {(filtros.tipo || filtros.estado || filtros.search) && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-blue-600 font-medium">Filtros activos - {paginacion.total} resultados</span>
          </div>
        )}
      </div>

      {/* Tabla con scroll horizontal en móvil */}
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
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Comienza creando una nueva unidad</p>
            <button
              onClick={() => navigate('/admin/unidades/crear')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              Nueva Unidad
            </button>
          </div>
        ) : (
          <>
            {/* Contenedor con scroll horizontal para móvil */}
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
                          <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${unidad.tipo === 'policia' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                            <Truck
                              size={12}
                              className={`sm:w-[14px] sm:h-[14px] lg:w-4 lg:h-4 ${unidad.tipo === 'policia' ? 'text-blue-600' : 'text-green-600'
                                }`}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[120px]">
                            {unidad.codigo}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs whitespace-nowrap ${unidad.tipo === 'policia' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {unidad.tipo === 'policia' ? 'Policía' : 'Ambulancia'}
                        </span>
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
                          <Users size={12} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {unidad.personal_asignado?.length || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-1.5 lg:gap-2">
                          <button
                            onClick={() => handleToggleActivo(unidad.id, unidad.codigo, unidad)}
                            className={`p-1 rounded-lg transition-colors ${unidad.activa ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'
                              }`}
                            title={unidad.activa ? 'Desactivar' : 'Activar'}
                          >
                            <Power size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px]" />
                          </button>

                          <button
                            onClick={() => handleVerDetalle(unidad.id, unidad)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                            title="Ver detalles"
                          >
                            <Eye size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-gray-500" />
                          </button>

                          <button
                            onClick={() => handleEditar(unidad.id, unidad)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                            title="Editar"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-gray-500" />
                          </button>

                          <button
                            onClick={() => handleEliminar(unidad.id, unidad.codigo, unidad)}
                            className="p-1 hover:bg-red-50 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación - RESPONSIVE */}
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t flex flex-col xs:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500 text-center xs:text-left">
                <span className="hidden xs:inline">Mostrando </span>
                <span className="font-medium">{paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0}</span>
                <span className="hidden xs:inline"> a </span>
                <span className="xs:hidden">-</span>
                <span className="font-medium">{Math.min(paginacion.pagina * paginacion.limite, paginacion.total)}</span>
                <span className="hidden xs:inline"> de </span>
                <span className="xs:hidden">/</span>
                <span className="font-medium">{paginacion.total}</span>
                <span className="hidden xs:inline"> registros</span>
              </p>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacion.pagina === 1}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600">
                  {paginacion.pagina} / {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Reporte (ReporteBase) - MANTENIDO PARA COMPATIBILIDAD */}
      {mostrarReporte && (
        <ReporteBase
          titulo="Reporte de Unidades"
          tipo="unidades"
          datos={unidades.map(u => ({
            id: u.id,
            codigo: u.codigo,
            tipo: u.tipo === 'policia' ? 'Policía' : 'Ambulancia',
            estado: capitalizar(u.estado),
            activa: u.activa ? 'Sí' : 'No',
            personal: u.personal_asignado?.length || 0,
            ubicacion: u.lat && u.lng ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}` : 'Sin ubicación',
            creado_en: new Date(u.creado_en).toLocaleDateString()
          }))}
          columnas={[
            { key: 'id', label: 'ID' },
            { key: 'codigo', label: 'Código' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'estado', label: 'Estado' },
            { key: 'activa', label: 'Activa' },
            { key: 'personal', label: 'Personal' },
            { key: 'creado_en', label: 'Fecha Creación' }
          ]}
          onClose={() => setMostrarReporte(false)}
        />
      )}
    </div>
  );
};

export default UnidadesList;