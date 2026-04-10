import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Filter, Download,
  Loader, Users, Truck, Bell, FileSpreadsheet,
  FilePieChart, Eye, X, RefreshCw, MapPin,
  TrendingUp, Clock, AlertTriangle, CheckCircle,
  Activity, BarChart3, XCircle, Search
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import unidadService from '../../../services/admin/unidad.service';
import alertasService from '../../../services/admin/alertas.service';
import reportesService from '../../../services/admin/reportes.service';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';
import IconoEntidad, { BadgeTipoAlerta, BadgeIcono } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';

// Mapeos correctos de roles y tipos
const rolToEntidad = {
  policia: 'POLICIA',
  paramedico: 'PARAMEDICO',
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  operador_tecnico: 'OPERADOR_TECNICO',
  operador_policial: 'OPERADOR_POLICIAL',
  operador_medico: 'OPERADOR_MEDICO',
  operador_general: 'OPERADOR_GENERAL'
};

const tipoUnidadToEntidad = {
  patrulla: 'PATRULLA',
  ambulancia: 'AMBULANCIA'
};

const GeneradorReporte = () => {
  const navigate = useNavigate();
  const { tipo } = useParams();
  const { user } = useAuthStore();

  // ✅ OBTENER TODOS LOS FILTROS DE SEGURIDAD
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  const rolPersonalPermitido = authService.getRolPersonalPermitido();
  const tipoUnidadPermitido = authService.getTipoUnidadPermitido();

  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [datos, setDatos] = useState([]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const getInitialTipo = () => {
    if (tipo === 'personal' && rolPersonalPermitido) {
      return rolPersonalPermitido;
    }
    if (tipo === 'alertas' && tipoAlertaPermitido) {
      return tipoAlertaPermitido;
    }
    if (tipo === 'unidades' && tipoUnidadPermitido) {
      return tipoUnidadPermitido;
    }
    return 'todos';
  };

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: getInitialTipo(),
    estado: 'todos',
    zona: 'todas',
    busqueda: ''
  });
  const [vistaPrevia, setVistaPrevia] = useState(true);

  const abortControllerRef = useRef(null);

  const config = {
    personal: {
      titulo: 'Reporte de Personal',
      icono: Users,
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-700',
      campos: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'rol', label: 'Rol' },
        { key: 'placa', label: 'Placa' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'activo', label: 'Estado' },
        { key: 'disponible', label: 'Disponible' },
        { key: 'creado_en', label: 'Fecha Registro' }
      ],
      filtrosDisponibles: [
        { tipo: 'rol', opciones: rolPersonalPermitido ? [rolPersonalPermitido] : ['policia', 'paramedico', 'admin', 'superadmin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'] },
        { tipo: 'estado', opciones: ['activo', 'inactivo'] }
      ],
      metricas: ['Total', 'Activos', 'Inactivos', 'Disponibles', 'Ocupados']
    },
    unidades: {
      titulo: 'Reporte de Unidades',
      icono: Truck,
      color: 'purple',
      gradient: 'from-purple-600 to-indigo-700',
      campos: [
        { key: 'codigo', label: 'Código' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'activa', label: 'Activa' },
        { key: 'personal_asignado', label: 'Personal' },
        { key: 'ubicacion', label: 'Ubicación' },
        { key: 'creado_en', label: 'Fecha Registro' }
      ],
      filtrosDisponibles: [
        { tipo: 'tipo', opciones: tipoUnidadPermitido ? [tipoUnidadPermitido] : ['patrulla', 'ambulancia'] },
        { tipo: 'estado', opciones: ['disponible', 'ocupada', 'inactiva'] }
      ],
      metricas: ['Total', 'Activas', 'Inactivas', 'Disponibles', 'Ocupadas']
    },
    alertas: {
      titulo: 'Reporte de Alertas',
      icono: Bell,
      color: 'amber',
      gradient: 'from-amber-600 to-orange-700',
      campos: [
        { key: 'id', label: 'ID' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'ciudadano_nombre', label: 'Ciudadano' },
        { key: 'unidad_codigo', label: 'Unidad' },
        { key: 'tiempo_respuesta', label: 'Tiempo Respuesta' },
        { key: 'fecha_creacion', label: 'Fecha Creación' },
        { key: 'fecha_cierre', label: 'Fecha Cierre' },
        { key: 'zona', label: 'Zona' },
        { key: 'motivo', label: 'Motivo Cierre' }
      ],
      filtrosDisponibles: [
        { tipo: 'tipo', opciones: tipoAlertaPermitido ? [tipoAlertaPermitido] : ['panico', 'medica'] },
        { tipo: 'estado', opciones: ['activa', 'asignada', 'atendiendo', 'cerrada', 'expirada'] }
      ],
      metricas: ['Total', 'Activas', 'En Proceso', 'Cerradas', 'Expiradas', 'Tiempo Promedio']
    }
  };

  const info = config[tipo] || config.personal;

  // ✅ CORRECCIÓN: Cargar datos con filtros de seguridad
  const cargarDatos = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en GeneradorReporte');
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setCargando(true);
    try {
      let data = [];
      let params = { signal, limite: 1000 };

      if (filtros.fechaInicio) params.desde = filtros.fechaInicio;
      if (filtros.fechaFin) params.hasta = filtros.fechaFin;

      // ✅ APLICAR FILTROS DE SEGURIDAD SEGÚN EL TIPO
      if (tipo === 'personal' && rolPersonalPermitido) {
        params.rol = rolPersonalPermitido;
        console.log(`📊 Aplicando filtro de personal: ${rolPersonalPermitido}`);
      }
      if (tipo === 'unidades' && tipoUnidadPermitido) {
        params.tipo = tipoUnidadPermitido;
        console.log(`📊 Aplicando filtro de unidades: ${tipoUnidadPermitido}`);
      }
      if (tipo === 'alertas' && tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
        console.log(`📊 Aplicando filtro de alertas: ${tipoAlertaPermitido}`);
      }

      if (tipo === 'personal') {
        const res = await personalService.listarPersonal(params);
        data = res.data || [];
        console.log(`📊 Personal cargado: ${data.length}`);
      } else if (tipo === 'unidades') {
        const res = await unidadService.listarUnidades(params);
        data = res.data || [];
        console.log(`📊 Unidades cargadas: ${data.length}`);
      } else if (tipo === 'alertas') {
        const [exp, cer] = await Promise.all([
          alertasService.obtenerExpiradas(params).catch(() => ({ data: [] })),
          alertasService.obtenerCerradasManual(params).catch(() => ({ data: [] }))
        ]);
        data = [...(exp.data || []), ...(cer.data || [])];
        console.log(`📊 Alertas cargadas: ${data.length}`);
      }

      setDatos(data);
      if (data.length === 0) {
        toast.info(`No se encontraron registros para ${info.titulo.toLowerCase()}`);
      } else {
        toast.success(`${data.length} registros cargados`);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar datos');
      }
    } finally {
      setCargando(false);
    }
  }, [tipo, filtros.fechaInicio, filtros.fechaFin, rolPersonalPermitido, tipoAlertaPermitido, tipoUnidadPermitido, info.titulo]);

  useEffect(() => {
    cargarDatos();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cargarDatos]);

  useEffect(() => {
    aplicarFiltrosYEstadisticas();
  }, [datos, filtros]);

  const calcularZona = (lat, lng) => {
    if (!lat || !lng) return 'No especificada';
    if (lat > 19.5) return 'Norte';
    if (lat < 18.5) return 'Sur';
    return 'Centro';
  };

  const calcularTiempoRespuesta = (creacion, cierre) => {
    if (!creacion || !cierre) return '—';
    const minutos = Math.round((new Date(cierre) - new Date(creacion)) / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const aplicarFiltrosYEstadisticas = () => {
    let filtrados = [...datos];

    if (filtros.fechaInicio || filtros.fechaFin) {
      filtrados = filtrados.filter(item => {
        // Obtener la fecha del item (diferentes campos según tipo)
        const fechaStr = item.fecha_creacion || item.creado_en || item.fecha;
        if (!fechaStr) return true; // Si no tiene fecha, no filtrar

        const fechaItem = new Date(fechaStr);
        if (isNaN(fechaItem.getTime())) return true; // Fecha inválida, no filtrar

        if (filtros.fechaInicio && filtros.fechaFin) {
          const inicio = new Date(filtros.fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          const fin = new Date(filtros.fechaFin);
          fin.setHours(23, 59, 59, 999);
          return fechaItem >= inicio && fechaItem <= fin;
        } else if (filtros.fechaInicio) {
          const inicio = new Date(filtros.fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          return fechaItem >= inicio;
        } else if (filtros.fechaFin) {
          const fin = new Date(filtros.fechaFin);
          fin.setHours(23, 59, 59, 999);
          return fechaItem <= fin;
        }
        return true;
      });
    }


    if (filtros.tipo !== 'todos') {
      if (tipo === 'personal') {
        filtrados = filtrados.filter(item => item.rol === filtros.tipo);
      } else if (tipo === 'alertas') {
        filtrados = filtrados.filter(item => item.tipo === filtros.tipo);
      } else if (tipo === 'unidades') {
        filtrados = filtrados.filter(item => item.tipo === filtros.tipo);
      }
    }

    if (filtros.estado !== 'todos') {
      filtrados = filtrados.filter(item => {
        if (tipo === 'personal') return item.activo === (filtros.estado === 'activo');
        if (tipo === 'unidades') return item.estado === filtros.estado;
        if (tipo === 'alertas') return item.estado === filtros.estado;
        return true;
      });
    }

    if (tipo === 'alertas' && filtros.zona !== 'todas') {
      filtrados = filtrados.filter(item => {
        const zona = calcularZona(item.lat, item.lng);
        return zona === filtros.zona;
      });
    }

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(item => {
        if (tipo === 'personal') {
          return item.nombre?.toLowerCase().includes(busqueda) ||
            item.email?.toLowerCase().includes(busqueda) ||
            item.placa?.toLowerCase().includes(busqueda);
        }
        if (tipo === 'unidades') {
          return item.codigo?.toLowerCase().includes(busqueda);
        }
        if (tipo === 'alertas') {
          return item.id?.toString().includes(busqueda) ||
            item.ciudadano?.nombre?.toLowerCase().includes(busqueda);
        }
        return true;
      });
    }

    setDatosFiltrados(filtrados);
    calcularEstadisticas(filtrados);
  };

  const calcularEstadisticas = (datosFiltrados) => {
    const stats = {};

    if (tipo === 'personal') {
      stats.total = datosFiltrados.length;
      stats.activos = datosFiltrados.filter(d => d.activo).length;
      stats.inactivos = datosFiltrados.filter(d => !d.activo).length;
      stats.disponibles = datosFiltrados.filter(d => d.disponible).length;
      stats.ocupados = datosFiltrados.filter(d => !d.disponible && d.activo).length;
      stats.porRol = {
        policia: datosFiltrados.filter(d => d.rol === 'policia').length,
        paramedico: datosFiltrados.filter(d => d.rol === 'paramedico').length,
        admin: datosFiltrados.filter(d => d.rol === 'admin').length,
        superadmin: datosFiltrados.filter(d => d.rol === 'superadmin').length,
        operador_tecnico: datosFiltrados.filter(d => d.rol === 'operador_tecnico').length,
        operador_policial: datosFiltrados.filter(d => d.rol === 'operador_policial').length,
        operador_medico: datosFiltrados.filter(d => d.rol === 'operador_medico').length,
        operador_general: datosFiltrados.filter(d => d.rol === 'operador_general').length
      };
    } else if (tipo === 'unidades') {
      stats.total = datosFiltrados.length;
      stats.activas = datosFiltrados.filter(d => d.activa).length;
      stats.inactivas = datosFiltrados.filter(d => !d.activa).length;
      stats.disponibles = datosFiltrados.filter(d => d.estado === 'disponible').length;
      stats.ocupadas = datosFiltrados.filter(d => d.estado === 'ocupada').length;
      stats.porTipo = {
        patrulla: datosFiltrados.filter(d => d.tipo === 'patrulla').length,
        ambulancia: datosFiltrados.filter(d => d.tipo === 'ambulancia').length
      };
    } else if (tipo === 'alertas') {
      stats.total = datosFiltrados.length;
      stats.activas = datosFiltrados.filter(d => d.estado === 'activa').length;
      stats.enProceso = datosFiltrados.filter(d => ['asignada', 'atendiendo'].includes(d.estado)).length;
      stats.cerradas = datosFiltrados.filter(d => d.estado === 'cerrada').length;
      stats.expiradas = datosFiltrados.filter(d => d.estado === 'expirada').length;

      const tiempos = datosFiltrados
        .filter(d => d.fecha_creacion && d.fecha_cierre)
        .map(d => (new Date(d.fecha_cierre) - new Date(d.fecha_creacion)) / 60000);
      stats.tiempoPromedio = tiempos.length > 0
        ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
        : 0;
      stats.porTipo = {
        panico: datosFiltrados.filter(d => d.tipo === 'panico').length,
        medica: datosFiltrados.filter(d => d.tipo === 'medica').length
      };

      const zonas = {};
      datosFiltrados.forEach(d => {
        const zona = calcularZona(d.lat, d.lng);
        zonas[zona] = (zonas[zona] || 0) + 1;
      });
      stats.porZona = zonas;
    }

    setEstadisticas(stats);
  };

  const exportarExcel = async () => {
    if (datosFiltrados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    setExportando(true);
    try {
      await reportesService.generarExcelPersonalizado(datosFiltrados, tipo, filtros, user, estadisticas);
      toast.success('Reporte Excel generado');
    } catch (error) {
      console.error('Error generando Excel:', error);
      toast.error('Error generando Excel');
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    if (datosFiltrados.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    setExportando(true);
    try {
      await reportesService.generarPDFPersonalizado(datosFiltrados, tipo, filtros, user, estadisticas);
      toast.success('Reporte PDF generado');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error generando PDF');
    } finally {
      setExportando(false);
    }
  };

  const renderValorCelda = (item, campo) => {
    let valor = item[campo.key];

    if (campo.key === 'tiempo_respuesta' && item.fecha_creacion && item.fecha_cierre) {
      valor = calcularTiempoRespuesta(item.fecha_creacion, item.fecha_cierre);
    } else if (campo.key === 'zona' && item.lat && item.lng) {
      valor = calcularZona(item.lat, item.lng);
    } else if (campo.key === 'ciudadano_nombre') {
      valor = item.ciudadano?.nombre || '—';
    } else if (campo.key === 'unidad_codigo') {
      valor = item.unidad?.codigo || '—';
    } else if (campo.key === 'activo') {
      valor = item.activo ? 'Activo' : 'Inactivo';
    } else if (campo.key === 'disponible') {
      valor = item.disponible ? 'Disponible' : 'No disponible';
    } else if (campo.key === 'personal_asignado') {
      valor = item.personal_asignado?.length || 0;
    } else if (campo.key === 'ubicacion' && item.lat && item.lng) {
      valor = `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`;
    } else if (campo.key === 'creado_en' || campo.key === 'fecha_creacion') {
      valor = new Date(item[campo.key]).toLocaleDateString('es-MX');
    }

    return valor?.toString() || '-';
  };

  const renderBadgeRol = (rol) => {
    const entidad = rolToEntidad[rol] || 'ADMIN';
    const texto =
      rol === 'policia' ? 'Policía' :
        rol === 'paramedico' ? 'Paramédico' :
          rol === 'admin' ? 'Admin' :
            rol === 'superadmin' ? 'Superadmin' :
              rol === 'operador_tecnico' ? 'Op. Técnico' :
                rol === 'operador_policial' ? 'Op. Policial' :
                  rol === 'operador_medico' ? 'Op. Médico' :
                    rol === 'operador_general' ? 'Op. General' : rol;
    return <BadgeIcono entidad={entidad} texto={texto} size={12} />;
  };

  const renderBadgeTipoUnidad = (tipo) => {
    const entidad = tipoUnidadToEntidad[tipo] || 'PATRULLA';
    const texto = tipo === 'patrulla' ? 'Patrulla' : 'Ambulancia';
    return <BadgeIcono entidad={entidad} texto={texto} size={12} />;
  };

  const renderBadgeAlerta = (tipo) => {
    return <BadgeTipoAlerta tipo={tipo} size={12} />;
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-500">Cargando datos para el reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/reportes')}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className={`bg-gradient-to-r ${info.gradient} p-2 rounded-lg shadow-lg`}>
                <info.icono size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{info.titulo}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {datosFiltrados.length} registros encontrados
              {tipo === 'personal' && rolPersonalPermitido && ` (${rolPersonalPermitido === 'policia' ? 'Solo Policía' : 'Solo Paramédico'})`}
              {tipo === 'unidades' && tipoUnidadPermitido && ` (${tipoUnidadPermitido === 'patrulla' ? 'Solo Patrullas' : 'Solo Ambulancias'})`}
              {tipo === 'alertas' && tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVistaPrevia(!vistaPrevia)}
            className="px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <Eye size={16} className="text-gray-500" />
            {vistaPrevia ? 'Ocultar' : 'Ver'} vista
          </button>
          <button
            onClick={exportarExcel}
            disabled={exportando || datosFiltrados.length === 0}
            className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 text-sm shadow-md disabled:opacity-50"
          >
            {exportando ? <Loader size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Excel
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando || datosFiltrados.length === 0}
            className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-2 text-sm shadow-md disabled:opacity-50"
          >
            {exportando ? <Loader size={16} className="animate-spin" /> : <FilePieChart size={16} />}
            PDF
          </button>
          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={`text-gray-500 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-xl shadow-lg p-5 mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">Filtros del reporte</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              disabled={(tipo === 'personal' && rolPersonalPermitido) ||
                (tipo === 'unidades' && tipoUnidadPermitido) ||
                (tipo === 'alertas' && tipoAlertaPermitido)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100"
            >
              <option value="todos">Todos</option>
              {info.filtrosDisponibles[0]?.opciones.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="todos">Todos</option>
              {info.filtrosDisponibles[1]?.opciones.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          {tipo === 'alertas' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Zona</label>
              <select
                value={filtros.zona}
                onChange={(e) => setFiltros(prev => ({ ...prev, zona: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="todas">Todas las zonas</option>
                <option value="Norte">Norte</option>
                <option value="Sur">Sur</option>
                <option value="Centro">Centro</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Búsqueda</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar por ${tipo === 'personal' ? 'nombre, email o placa' :
                tipo === 'unidades' ? 'código' :
                  'ID o ciudadano'}`}
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {tipo === 'personal' && (
            <>
              <StatCard label="Total" value={estadisticas.total} icon={Users} color="blue" />
              <StatCard label="Activos" value={estadisticas.activos} icon={CheckCircle} color="green" />
              <StatCard label="Inactivos" value={estadisticas.inactivos} icon={XCircle} color="red" />
              <StatCard label="Disponibles" value={estadisticas.disponibles} icon={Activity} color="green" />
              <StatCard label="Ocupados" value={estadisticas.ocupados} icon={Clock} color="amber" />
            </>
          )}
          {tipo === 'unidades' && (
            <>
              <StatCard label="Total" value={estadisticas.total} icon={Truck} color="purple" />
              <StatCard label="Activas" value={estadisticas.activas} icon={CheckCircle} color="green" />
              <StatCard label="Disponibles" value={estadisticas.disponibles} icon={Activity} color="green" />
              <StatCard label="Ocupadas" value={estadisticas.ocupadas} icon={Clock} color="red" />
              <StatCard label="Inactivas" value={estadisticas.inactivas} icon={XCircle} color="gray" />
            </>
          )}
          {tipo === 'alertas' && (
            <>
              <StatCard label="Total Alertas" value={estadisticas.total} icon={Bell} color="amber" />
              <StatCard label="Activas" value={estadisticas.activas} icon={AlertTriangle} color="red" />
              <StatCard label="En Proceso" value={estadisticas.enProceso} icon={Activity} color="blue" />
              <StatCard label="Cerradas" value={estadisticas.cerradas} icon={CheckCircle} color="green" />
              <StatCard label="Expiradas" value={estadisticas.expiradas} icon={XCircle} color="gray" />
              <StatCard label="Tiempo Prom." value={`${estadisticas.tiempoPromedio} min`} icon={Clock} color="purple" />
            </>
          )}
        </div>
      )}

      {/* Vista previa de datos */}
      {vistaPrevia && datosFiltrados.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Vista previa de datos</h2>
            <span className="text-xs text-gray-500">
              Mostrando {Math.min(10, datosFiltrados.length)} de {datosFiltrados.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {info.campos.map(campo => (
                    <th key={campo.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      {campo.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {datosFiltrados.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {info.campos.map(campo => {
                      const valor = renderValorCelda(item, campo);

                      if (campo.key === 'rol' && tipo === 'personal') {
                        return (
                          <td key={campo.key} className="px-4 py-3">
                            {renderBadgeRol(item.rol)}
                          </td>
                        );
                      }
                      if (campo.key === 'tipo' && tipo === 'unidades') {
                        return (
                          <td key={campo.key} className="px-4 py-3">
                            {renderBadgeTipoUnidad(item.tipo)}
                          </td>
                        );
                      }
                      if (campo.key === 'tipo' && tipo === 'alertas') {
                        return (
                          <td key={campo.key} className="px-4 py-3">
                            {renderBadgeAlerta(item.tipo)}
                          </td>
                        );
                      }

                      return (
                        <td key={campo.key} className="px-4 py-3 text-sm text-gray-600">
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: Mensaje cuando hay datos pero vista previa oculta */}
      {!vistaPrevia && datosFiltrados.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <Eye size={16} />
            Vista previa oculta. Haz clic en "Ver vista" para previsualizar los datos.
          </p>
        </div>
      )}

      {/* ✅ NUEVO: Mensaje cuando no hay datos después de filtrar */}
      {datos.length > 0 && datosFiltrados.length === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <Filter size={16} />
            No hay registros que coincidan con los filtros aplicados.
          </p>
        </div>
      )}

      {/* Resumen del reporte */}
      <div className={`bg-gradient-to-r ${info.gradient} rounded-xl p-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <info.icono size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Resumen del reporte</p>
              <p className="text-xs text-white/80">
                Se incluirán {datosFiltrados.length} registros en el reporte final
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={exportarExcel}
              disabled={exportando || datosFiltrados.length === 0}
              className="flex-1 sm:flex-none text-sm bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              {exportando ? <Loader size={16} className="inline mr-2 animate-spin" /> : <FileSpreadsheet size={16} className="inline mr-2" />}
              Excel
            </button>
            <button
              onClick={exportarPDF}
              disabled={exportando || datosFiltrados.length === 0}
              className="flex-1 sm:flex-none text-sm bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              {exportando ? <Loader size={16} className="inline mr-2 animate-spin" /> : <FilePieChart size={16} className="inline mr-2" />}
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100'
  };

  return (
    <div className={`${colors[color]} rounded-lg p-3 flex items-center gap-2 border`}>
      <Icon size={16} />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default GeneradorReporte;