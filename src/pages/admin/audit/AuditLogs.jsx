// src/pages/admin/audit/AuditLogs.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Calendar, User, AlertTriangle, Info,
  Shield, X, Loader, Clock, Activity, TrendingUp, TrendingDown,
  RefreshCw, FileSpreadsheet, FilePieChart, Copy, Check,
  Plus, Trash2, Edit2, Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import auditService from '../../../services/admin/audit.service';
import { useDebounce } from '../../../hooks/useDebounce';
import reportesService from '../../../services/admin/reportes.service';
import useAuthStore from '../../../store/authStore';

// =====================================================
// COMPONENTE Minus (para tendencia estable)
// =====================================================
const Minus = ({ size = 12, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
  </svg>
);

// =====================================================
// COLORES POR SEVERIDAD
// =====================================================
const severityColors = {
  info: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  forensic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
};

// Mapeo de severidad a íconos
const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: Shield,
  forensic: Activity
};

// =====================================================
// FUNCIÓN AUXILIAR: Formatear valores para visualización
// =====================================================
const formatValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✅ Sí' : '❌ No';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleString('es-MX');
  }
  return String(value);
};

// =====================================================
// COMPONENTE: Visualización de cambios en lenguaje natural
// =====================================================
const CambiosVisual = ({ beforeData, afterData }) => {
  if (!beforeData && !afterData) return null;
  
  // Si solo hay datos después (creación)
  if (!beforeData && afterData) {
    const camposImportantes = ['nombre', 'email', 'rol', 'tipo', 'codigo', 'placa'];
    const datosMostrar = Object.entries(afterData)
      .filter(([key]) => camposImportantes.includes(key) || (!key.includes('_en') && key !== 'id' && key !== 'creado_por' && key !== 'actualizado_por'))
      .slice(0, 8);
    
    return (
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Plus size={14} className="text-green-600" />
          </div>
          <span className="text-sm font-semibold text-green-700">Registro creado</span>
        </div>
        <div className="space-y-2">
          {datosMostrar.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="text-gray-500 min-w-[100px] capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-800 font-medium">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Si solo hay datos antes (eliminación)
  if (beforeData && !afterData) {
    const camposImportantes = ['nombre', 'email', 'rol', 'tipo', 'codigo', 'placa'];
    const datosMostrar = Object.entries(beforeData)
      .filter(([key]) => camposImportantes.includes(key) || (!key.includes('_en') && key !== 'id' && key !== 'creado_por' && key !== 'actualizado_por'))
      .slice(0, 8);
    
    return (
      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <Trash2 size={14} className="text-red-600" />
          </div>
          <span className="text-sm font-semibold text-red-700">Registro eliminado</span>
        </div>
        <div className="space-y-2">
          {datosMostrar.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="text-gray-500 min-w-[100px] capitalize">{key.replace(/_/g, ' ')}:</span>
              <span className="text-gray-800 font-medium line-through decoration-red-400">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Comparar cambios entre before y after
  const cambios = [];
  const todasLasKeys = new Set([...Object.keys(beforeData), ...Object.keys(afterData)]);
  const camposIgnorar = ['id', 'creado_en', 'actualizado_en', 'fecha_eliminacion', 'creado_por', 'actualizado_por'];
  
  for (const key of todasLasKeys) {
    if (camposIgnorar.includes(key)) continue;
    const before = beforeData[key];
    const after = afterData[key];
    
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      cambios.push({
        campo: key,
        antes: before,
        despues: after
      });
    }
  }
  
  if (cambios.length === 0) return null;
  
  return (
    <div className="space-y-3">
      {cambios.map(({ campo, antes, despues }) => (
        <div key={campo} className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-amber-100 rounded-lg">
              <Edit2 size={12} className="text-amber-600" />
            </div>
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              {campo.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor anterior</p>
              <p className="text-sm text-gray-600 line-through decoration-red-400">
                {formatValue(antes)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Nuevo valor</p>
              <p className="text-sm text-gray-800 font-medium text-green-700">
                {formatValue(despues)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================================
// COMPONENTE: Tarjeta de estadística
// =====================================================
const StatCard = ({ title, value, icon: Icon, color, subtitle, tendencia }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    green: 'from-green-500 to-green-600 shadow-green-200',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-200',
    red: 'from-red-500 to-red-600 shadow-red-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    gray: 'from-gray-500 to-gray-600 shadow-gray-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 p-4 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 bg-gradient-to-r ${colors[color]} rounded-lg shadow-lg`}>
          <Icon size={18} className="text-white" />
        </div>
        {tendencia !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            tendencia > 0 ? 'text-green-600 bg-green-50' : tendencia < 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'
          }`}>
            {tendencia > 0 ? <TrendingUp size={12} /> : tendencia < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(tendencia)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// =====================================================
// COMPONENTE PRINCIPAL: AuditLogs
// =====================================================
const AuditLogs = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 20,
    total_paginas: 0
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    usuario_email: '',
    accion: '',
    severidad: ''
  });

  // Refs para AbortControllers
  const abortControllerRef = useRef(null);
  const pollingAbortControllerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  const debouncedUsuario = useDebounce(filtros.usuario_email, 500);
  const debouncedAccion = useDebounce(filtros.accion, 500);

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return format(new Date(fecha), "dd/MM/yyyy HH:mm:ss", { locale: es });
  };

  // ✅ Función para cargar logs (con AbortController)
  const cargarLogs = useCallback(async (pagina = 1) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      const params = {
        page: pagina,
        limit: paginacion.limite,
        signal: abortControllerRef.current.signal,
        ...filtros
      };

      const response = await auditService.obtenerLogs(params);
      
      if (response.success) {
        setLogs(response.data);
        setEstadisticas(response.estadisticas);
        setPaginacion({
          ...paginacion,
          pagina: response.paginacion.pagina,
          total: response.paginacion.total,
          total_paginas: response.paginacion.total_paginas
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando logs:', error);
        toast.error('Error al cargar logs');
      }
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.limite]);

  // ✅ Función para recargar en segundo plano (polling)
  const recargarEnSegundoPlano = useCallback(async () => {
    if (pollingAbortControllerRef.current) {
      pollingAbortControllerRef.current.abort();
    }

    pollingAbortControllerRef.current = new AbortController();

    try {
      const params = {
        page: paginacion.pagina,
        limit: paginacion.limite,
        signal: pollingAbortControllerRef.current.signal,
        ...filtros
      };

      const response = await auditService.obtenerLogs(params);
      
      if (response.success && !pollingAbortControllerRef.current.signal.aborted) {
        // Verificar si hay nuevos logs
        const nuevosLogs = response.data;
        const hayNuevos = JSON.stringify(logs) !== JSON.stringify(nuevosLogs);
        
        if (hayNuevos) {
          setLogs(nuevosLogs);
          setEstadisticas(response.estadisticas);
          setPaginacion({
            ...paginacion,
            total: response.paginacion.total,
            total_paginas: response.paginacion.total_paginas
          });
          // Notificación sutil de nuevos registros
          toast.success('Nuevos registros de auditoría', {
            icon: <Bell size={14} />,
            duration: 3000
          });
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.debug('Error en polling:', error);
      }
    }
  }, [filtros, paginacion.pagina, paginacion.limite, logs]);

  // ✅ Iniciar polling automático
  useEffect(() => {
    cargarLogs(1);
    
    // Iniciar polling cada 10 segundos (solo si no hay modal abierto)
    pollingIntervalRef.current = setInterval(() => {
      if (!modalOpen && !loading) {
        recargarEnSegundoPlano();
      }
    }, 10000);
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (pollingAbortControllerRef.current) {
        pollingAbortControllerRef.current.abort();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cargarLogs, recargarEnSegundoPlano, modalOpen, loading]);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    cargarLogs(1);
  }, [debouncedUsuario, debouncedAccion, filtros.fecha_desde, filtros.fecha_hasta, filtros.severidad]);

  const handleVerDetalle = async (id) => {
    try {
      const response = await auditService.obtenerDetalle(id);
      if (response.success) {
        setSelectedLog(response.data);
        setModalOpen(true);
      }
    } catch (error) {
      toast.error('Error al cargar detalle');
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      usuario_email: '',
      accion: '',
      severidad: ''
    });
  };

  const cambiarPagina = (nuevaPagina) => {
    cargarLogs(nuevaPagina);
  };

  const exportarExcel = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte de Excel...', { id: 'export' });
      await reportesService.generarExcelPersonalizado(logs, 'audit_logs', filtros, user);
      toast.success('Reporte generado correctamente', { id: 'export' });
    } catch (error) {
      toast.error('Error al generar reporte', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  const exportarPDF = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte PDF...', { id: 'export' });
      await reportesService.generarPDFPersonalizado(logs, 'audit_logs', filtros, user);
      toast.success('Reporte PDF generado', { id: 'export' });
    } catch (error) {
      toast.error('Error al generar PDF', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  const handleCopyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success('JSON copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-gray-200">
              <FileText size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Auditoría</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Registro de actividades del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => cargarLogs(paginacion.pagina)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={exportarExcel}
              disabled={exportando || logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm shadow-md disabled:opacity-50"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={exportarPDF}
              disabled={exportando || logs.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm shadow-md disabled:opacity-50"
            >
              <FilePieChart size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm shadow-sm"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {estadisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              title="Total registros"
              value={estadisticas.total}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Últimas 24h"
              value={estadisticas.ultimas24h}
              icon={Clock}
              color="green"
            />
            <StatCard
              title="Últimos 7 días"
              value={estadisticas.ultimos7dias}
              icon={Activity}
              color="indigo"
            />
            <StatCard
              title="Críticos"
              value={estadisticas.porSeveridad?.find(s => s.severidad === 'critical')?.count || 0}
              icon={AlertTriangle}
              color="red"
            />
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-600" />
            <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
            {(filtros.fecha_desde || filtros.fecha_hasta || filtros.usuario_email || filtros.accion || filtros.severidad) && (
              <button onClick={limpiarFiltros} className="ml-auto text-xs text-blue-600 hover:text-blue-800">
                Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_hasta: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Usuario"
                value={filtros.usuario_email}
                onChange={(e) => setFiltros(prev => ({ ...prev, usuario_email: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Acción"
                value={filtros.accion}
                onChange={(e) => setFiltros(prev => ({ ...prev, accion: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <select
              value={filtros.severidad}
              onChange={(e) => setFiltros(prev => ({ ...prev, severidad: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las severidades</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="forensic">Forensic</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <Loader size={32} className="animate-spin text-blue-600 mx-auto" />
              <p className="mt-3 text-gray-500">Cargando registros...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No hay registros</h3>
              <p className="text-sm text-gray-500">No se encontraron logs con los filtros aplicados</p>
              {(filtros.fecha_desde || filtros.fecha_hasta || filtros.usuario_email || filtros.accion || filtros.severidad) && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log) => {
                      const SeverityIcon = severityIcons[log.severidad] || Info;
                      const severityStyle = severityColors[log.severidad] || severityColors.info;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {formatearFecha(log.creado_en)}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{log.usuario_email || 'Anónimo'}</p>
                              {log.usuario_rol && (
                                <p className="text-xs text-gray-400">{log.usuario_rol}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700 max-w-[200px] truncate" title={log.accion}>
                              {log.accion}
                            </p>
                            {log.accion_descripcion && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {log.accion_descripcion}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityStyle.bg} ${severityStyle.text}`}>
                              <SeverityIcon size={10} />
                              {log.severidad?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-500">
                            {log.ip_address || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleVerDetalle(log.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de{' '}
                  <span className="font-medium">{paginacion.total}</span> registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Página {paginacion.pagina} de {paginacion.total_paginas}
                  </span>
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina + 1)}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {modalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden animate-fadeInUp">
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${severityColors[selectedLog.severidad]?.bg || 'bg-gray-100'}`}>
                  {(() => {
                    const Icon = severityIcons[selectedLog.severidad] || FileText;
                    return <Icon size={18} className={severityColors[selectedLog.severidad]?.text || 'text-gray-600'} />;
                  })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Detalle de auditoría</h2>
                  <p className="text-xs text-gray-500">ID: #{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] space-y-5">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> Fecha y hora
                  </label>
                  <p className="text-sm font-medium text-gray-800 mt-1">{formatearFecha(selectedLog.creado_en)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <User size={12} /> Usuario
                  </label>
                  <p className="text-sm font-medium text-gray-800 mt-1">{selectedLog.usuario_email || 'Anónimo'}</p>
                  {selectedLog.usuario_rol && (
                    <p className="text-xs text-gray-400 mt-0.5">Rol: {selectedLog.usuario_rol}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Activity size={12} /> IP / Dispositivo
                  </label>
                  <p className="text-sm font-mono text-gray-800 mt-1">{selectedLog.ip_address || '-'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedLog.dispositivo_tipo || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <Shield size={12} /> Severidad
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[selectedLog.severidad]?.bg} ${severityColors[selectedLog.severidad]?.text}`}>
                      {selectedLog.severidad?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acción */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <FileText size={12} /> Acción
                </label>
                <p className="text-sm font-mono text-gray-800 bg-white p-2 rounded-lg border border-gray-200 break-all">
                  {selectedLog.accion}
                </p>
                {selectedLog.accion_descripcion && (
                  <p className="text-sm text-gray-600 mt-2">{selectedLog.accion_descripcion}</p>
                )}
                {selectedLog.recurso_ruta && (
                  <p className="text-xs text-gray-400 mt-2 font-mono">Ruta: {selectedLog.recurso_ruta}</p>
                )}
              </div>

              {/* Cambios en datos - Versión legible en lenguaje natural */}
              {(selectedLog.before_data || selectedLog.after_data) && (
                <div className="border-t pt-4">
                  <label className="text-xs font-semibold text-gray-600 mb-3 block">
                    Cambios realizados
                  </label>
                  <CambiosVisual 
                    beforeData={selectedLog.before_data} 
                    afterData={selectedLog.after_data} 
                  />
                </div>
              )}

              {/* Error (si existe) */}
              {selectedLog.error_mensaje && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <label className="text-xs text-red-600 flex items-center gap-1 mb-2">
                    <AlertTriangle size={12} /> Error
                  </label>
                  <p className="text-sm text-red-700">{selectedLog.error_mensaje}</p>
                  {selectedLog.status_code && (
                    <p className="text-xs text-red-500 mt-1">Código: {selectedLog.status_code}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;