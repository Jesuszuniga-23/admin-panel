import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Filter, Download,
  Loader, Users, Truck, Bell, FileSpreadsheet,
  FilePieChart, Eye, X, RefreshCw, MapPin,
  TrendingUp, Clock, AlertTriangle, CheckCircle,
  Activity, BarChart3, XCircle,Search
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import unidadService from '../../../services/admin/unidad.service';
import alertasService from '../../../services/admin/alertas.service';
import reportesService from '../../../services/admin/reportes.service';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';
import IconoEntidad, { BadgeTipoAlerta, BadgeIcono } from '../../../components/ui/IconoEntidad';

// Mapeo de roles/tipos a entidades
const rolToEntidad = {
  policia: 'POLICIA',
  ambulancia: 'PERSONAL_AMBULANCIA',
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN'
};

const tipoUnidadToEntidad = {
  policia: 'PATRULLA',
  ambulancia: 'AMBULANCIA'
};

const GeneradorReporte = () => {
  const navigate = useNavigate();
  const { tipo } = useParams();
  const { user } = useAuthStore();
  
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState([]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: 'todos',
    estado: 'todos',
    zona: 'todas',
    busqueda: ''
  });
  const [vistaPrevia, setVistaPrevia] = useState(true);

  // Configuración según el tipo de reporte
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
        { tipo: 'rol', opciones: ['policia', 'ambulancia', 'admin', 'superadmin'] },
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
        { tipo: 'tipo', opciones: ['policia', 'ambulancia'] },
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
        { tipo: 'tipo', opciones: ['panico', 'medica'] },
        { tipo: 'estado', opciones: ['activa', 'asignada', 'atendiendo', 'cerrada', 'expirada'] }
      ],
      metricas: ['Total', 'Activas', 'En Proceso', 'Cerradas', 'Expiradas', 'Tiempo Promedio']
    }
  };

  const info = config[tipo] || config.personal;

  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  useEffect(() => {
    aplicarFiltrosYEstadisticas();
  }, [datos, filtros]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let data = [];
      let params = {};
      
      if (filtros.fechaInicio) params.desde = filtros.fechaInicio;
      if (filtros.fechaFin) params.hasta = filtros.fechaFin;
      
      if (tipo === 'personal') {
        const res = await personalService.listarPersonal({ limite: 1000, ...params });
        data = res.data || [];
      } else if (tipo === 'unidades') {
        const res = await unidadService.listarUnidades({ limite: 1000, ...params });
        data = res.data || [];
      } else if (tipo === 'alertas') {
        const [exp, cer, act, proc] = await Promise.all([
          alertasService.obtenerExpiradas({ limite: 500, ...params }),
          alertasService.obtenerCerradasManual({ limite: 500, ...params }),
          alertasService.obtenerActivas?.({ limite: 500, ...params }) || Promise.resolve({ data: [] }),
          alertasService.obtenerEnProceso?.({ limite: 500, ...params }) || Promise.resolve({ data: [] })
        ]);
        
        data = [
          ...(exp.data || []),
          ...(cer.data || []),
          ...(act.data || []),
          ...(proc.data || [])
        ];
      }

      setDatos(data);
      toast.success(`${data.length} registros cargados`);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

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

    if (filtros.fechaInicio && filtros.fechaFin) {
      const inicio = new Date(filtros.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion || item.creado_en);
        return fecha >= inicio && fecha <= fin;
      });
    } else if (filtros.fechaInicio) {
      const inicio = new Date(filtros.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion || item.creado_en);
        return fecha >= inicio;
      });
    } else if (filtros.fechaFin) {
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion || item.creado_en);
        return fecha <= fin;
      });
    }

    if (filtros.tipo !== 'todos') {
      filtrados = filtrados.filter(item => 
        item.tipo === filtros.tipo || item.rol === filtros.tipo
      );
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
        ambulancia: datosFiltrados.filter(d => d.rol === 'ambulancia').length,
        admin: datosFiltrados.filter(d => d.rol === 'admin').length,
        superadmin: datosFiltrados.filter(d => d.rol === 'superadmin').length
      };
    } else if (tipo === 'unidades') {
      stats.total = datosFiltrados.length;
      stats.activas = datosFiltrados.filter(d => d.activa).length;
      stats.inactivas = datosFiltrados.filter(d => !d.activa).length;
      stats.disponibles = datosFiltrados.filter(d => d.estado === 'disponible').length;
      stats.ocupadas = datosFiltrados.filter(d => d.estado === 'ocupada').length;
      
      stats.porTipo = {
        policia: datosFiltrados.filter(d => d.tipo === 'policia').length,
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

  const exportarExcel = () => {
    try {
      reportesService.generarExcelPersonalizado(datosFiltrados, tipo, filtros, user, estadisticas);
      toast.success('Reporte Excel generado');
    } catch (error) {
      toast.error('Error generando Excel');
    }
  };

  const exportarPDF = () => {
    try {
      reportesService.generarPDFPersonalizado(datosFiltrados, tipo, filtros, user, estadisticas);
      toast.success('Reporte PDF generado');
    } catch (error) {
      toast.error('Error generando PDF');
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
    const texto = rol === 'policia' ? 'Policía' :
                  rol === 'ambulancia' ? 'Ambulancia' :
                  rol === 'admin' ? 'Admin' :
                  rol === 'superadmin' ? 'Superadmin' : rol;
    return <BadgeIcono entidad={entidad} texto={texto} size={12} />;
  };

  const renderBadgeTipoUnidad = (tipo) => {
    const entidad = tipoUnidadToEntidad[tipo] || 'PATRULLA';
    const texto = tipo === 'policia' ? 'Policía' : 'Ambulancia';
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
              <div className={`bg-gradient-to-r ${info.gradient} p-2 rounded-lg shadow-lg shadow-${info.color}-200`}>
                <info.icono size={20} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{info.titulo}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {datosFiltrados.length} registros encontrados
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
            className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button
            onClick={exportarPDF}
            className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors flex items-center gap-2 text-sm shadow-md"
          >
            <FilePieChart size={16} />
            PDF
          </button>
          <button
            onClick={cargarDatos}
            className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
            <h2 className="text-sm font-semibold text-gray-700">
              Vista previa de datos
            </h2>
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
                      let valor = renderValorCelda(item, campo);
                      
                      // Renderizado especial para ciertos campos
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

      {/* Resumen del reporte */}
      <div className={`bg-gradient-to-r ${info.gradient} rounded-xl p-4 border border-${info.color}-200`}>
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
              className="flex-1 sm:flex-none text-sm bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <FileSpreadsheet size={16} className="inline mr-2" />
              Excel
            </button>
            <button
              onClick={exportarPDF}
              className="flex-1 sm:flex-none text-sm bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <FilePieChart size={16} className="inline mr-2" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de estadísticas
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