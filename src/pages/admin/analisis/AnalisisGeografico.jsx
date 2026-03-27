// src/pages/admin/analisis/AnalisisGeografico.jsx
// VERSIÓN ESTABLE - SIN MAPA, SOLO GRÁFICAS Y ESTADÍSTICAS

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, BarChart3, PieChart, Calendar, Filter, ChevronLeft, AlertTriangle,
  Heart, Clock, Bell, Info, Layers, XCircle, CheckCircle, Activity,
  Map, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart as RePieChart, 
  Pie, Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import analisisGeograficoService from '../../../services/admin/analisisGeografico.service';
import reportesService from '../../../services/admin/reportes.service';
import reportesGraficasService from '../../../services/admin/reportesGraficas.service';
import Loader from '../../../components/common/Loader';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeTipoAlerta } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';
import { useDebounce } from '../../../hooks/useDebounce';

const COLORS = {
  panico: '#EF4444',
  medica: '#10B981'
};

const AnalisisGeografico = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  const graficaBarrasRef = useRef(null);
  const graficaPastelRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [alertasFiltradas, setAlertasFiltradas] = useState([]);
  const [datosPorZona, setDatosPorZona] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0, conUbicacion: 0, sinUbicacion: 0,
    panico: 0, medica: 0, activas: 0, proceso: 0, cerradas: 0, expiradas: 0
  });
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: tipoAlertaPermitido || 'todos',
    estado: 'todos',
    zona: 'todas'
  });

  const debouncedFiltros = useDebounce(filtros, 500);

  // ✅ Funciones de cálculo locales
  const calcularZonaLocal = useCallback((lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return 'Sin ubicación';
    if (lat > 19.6) return 'Zona Norte';
    if (lat > 19.4 && lat <= 19.6) {
      if (lng < -99.2) return 'Zona Poniente';
      if (lng > -99.0) return 'Zona Oriente';
      return 'Zona Centro';
    }
    if (lat <= 19.4) return 'Zona Sur';
    return 'Otra zona';
  }, []);

  const calcularEstadisticasLocal = useCallback((alertasData) => {
    const conUbicacion = alertasData.filter(a => a.lat && a.lng).length;
    return {
      total: alertasData.length,
      conUbicacion,
      sinUbicacion: alertasData.length - conUbicacion,
      panico: alertasData.filter(a => a.tipo === 'panico').length,
      medica: alertasData.filter(a => a.tipo === 'medica').length,
      activas: alertasData.filter(a => a.estado === 'activa').length,
      proceso: alertasData.filter(a => ['asignada', 'atendiendo'].includes(a.estado)).length,
      cerradas: alertasData.filter(a => a.estado === 'cerrada').length,
      expiradas: alertasData.filter(a => a.estado === 'expirada').length
    };
  }, []);

  const procesarZonasLocal = useCallback((alertasData) => {
    const zonas = {};
    alertasData.forEach(alerta => {
      if (!alerta.lat || !alerta.lng) return;
      const zona = calcularZonaLocal(alerta.lat, alerta.lng);
      if (!zonas[zona]) {
        zonas[zona] = { zona, total: 0, panico: 0, medica: 0 };
      }
      zonas[zona].total++;
      if (alerta.tipo === 'panico') zonas[zona].panico++;
      else zonas[zona].medica++;
    });
    return Object.values(zonas).sort((a, b) => b.total - a.total);
  }, [calcularZonaLocal]);

  const aplicarFiltrosLocales = useCallback((datos, filtrosActuales) => {
    let filtrados = [...datos];
    
    if (filtrosActuales.fechaInicio && filtrosActuales.fechaFin) {
      const inicio = new Date(filtrosActuales.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(filtrosActuales.fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion);
        return fecha >= inicio && fecha <= fin;
      });
    }
    
    if (filtrosActuales.tipo !== 'todos') {
      filtrados = filtrados.filter(item => item.tipo === filtrosActuales.tipo);
    }
    
    if (filtrosActuales.estado !== 'todos') {
      filtrados = filtrados.filter(item => {
        if (filtrosActuales.estado === 'activa') return item.estado === 'activa';
        if (filtrosActuales.estado === 'proceso') return ['asignada', 'atendiendo'].includes(item.estado);
        if (filtrosActuales.estado === 'cerrada') return item.estado === 'cerrada';
        if (filtrosActuales.estado === 'expirada') return item.estado === 'expirada';
        return true;
      });
    }
    
    if (filtrosActuales.zona !== 'todas') {
      filtrados = filtrados.filter(item => {
        const zona = calcularZonaLocal(item.lat, item.lng);
        return zona === filtrosActuales.zona;
      });
    }
    
    return filtrados;
  }, [calcularZonaLocal]);

  // ✅ Cargar datos - UNA SOLA PETICIÓN
  const cargarDatos = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    if (!isMountedRef.current) return;
    setCargando(true);
    
    try {
      const params = { signal: abortControllerRef.current.signal, limite: 5000 };
      if (tipoAlertaPermitido) params.tipo = tipoAlertaPermitido;
      
      const response = await analisisGeograficoService.obtenerDatosCompletos(params);
      
      if (!isMountedRef.current) return;
      
      if (response.success) {
        setAlertas(response.alertas || []);
        setEstadisticas(response.estadisticas || {});
        setDatosPorZona(response.datosPorZona || []);
        setTendencias(response.tendencias || []);
      } else {
        toast.error(response.error || 'Error al cargar datos');
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED' && isMountedRef.current) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar datos');
      }
    } finally {
      if (isMountedRef.current) setCargando(false);
    }
  }, [tipoAlertaPermitido]);

  // ✅ Aplicar filtros localmente
  useEffect(() => {
    if (alertas.length === 0) return;
    const filtrados = aplicarFiltrosLocales(alertas, debouncedFiltros);
    const stats = calcularEstadisticasLocal(filtrados);
    const zonas = procesarZonasLocal(filtrados);
    
    if (isMountedRef.current) {
      setAlertasFiltradas(filtrados);
      setEstadisticas(stats);
      setDatosPorZona(zonas);
    }
  }, [alertas, debouncedFiltros, aplicarFiltrosLocales, calcularEstadisticasLocal, procesarZonasLocal]);

  // ✅ Efecto principal
  useEffect(() => {
    isMountedRef.current = true;
    cargarDatos();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cargarDatos]);

  // ✅ Memoizar alertas para estadísticas
  const alertasConUbicacion = useMemo(() => {
    return alertasFiltradas.filter(a => a.lat && a.lng);
  }, [alertasFiltradas]);

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      tipo: tipoAlertaPermitido || 'todos',
      estado: 'todos',
      zona: 'todas'
    });
    setAlertaSeleccionada(null);
  };

  const capturarGraficas = async () => {
    const graficas = {};
    if (graficaBarrasRef.current) {
      const canvas = await html2canvas(graficaBarrasRef.current, { scale: 2, backgroundColor: '#ffffff' });
      graficas.barras = canvas.toDataURL('image/png');
    }
    if (graficaPastelRef.current) {
      const canvas = await html2canvas(graficaPastelRef.current, { scale: 2, backgroundColor: '#ffffff' });
      graficas.pastel = canvas.toDataURL('image/png');
    }
    return graficas;
  };

  const exportarExcel = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte de Excel...', { id: 'export' });
      await reportesService.generarExcelPersonalizado(alertasFiltradas, 'alertas', filtros, user);
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
      toast.loading('Generando PDF con gráficas...', { id: 'export' });
      const graficas = await capturarGraficas();
      await reportesGraficasService.generarPDFConGraficas(alertasFiltradas, 'alertas', filtros, user, {
        ...graficas,
        estadisticas,
        datosPorZona,
        tendencias
      });
      toast.success('PDF con gráficas generado correctamente', { id: 'export' });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar PDF con gráficas', { id: 'export' });
    } finally {
      setExportando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-10"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-200">
                <IconoEntidad entidad="MAPA" size={32} color="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Análisis Geográfico</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <IconoEntidad entidad="UBICACION" size={14} />
                  <span>{estadisticas.conUbicacion} ubicaciones registradas</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{datosPorZona.length} zonas identificadas</span>
                  {tipoAlertaPermitido && (
                    <>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-indigo-600">Filtrado: {tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportarExcel} disabled={exportando} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all text-sm shadow-md disabled:opacity-50">
                <FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span>
              </button>
              <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all text-sm shadow-md disabled:opacity-50">
                <FilePieChart size={16} /><span className="hidden sm:inline">PDF Gráficas</span>
              </button>
              <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm">
                <ChevronLeft size={16} /><span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 rounded-lg"><Filter size={18} className="text-indigo-600" /></div>
            <h2 className="text-base font-semibold text-gray-800">Filtros de análisis</h2>
            {(filtros.fechaInicio || filtros.fechaFin || filtros.tipo !== 'todos' || filtros.estado !== 'todos' || filtros.zona !== 'todas') && (
              <button onClick={limpiarFiltros} className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full">Limpiar todo</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Calendar size={12} /> Desde</label>
              <input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Calendar size={12} /> Hasta</label>
              <input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><AlertTriangle size={12} /> Tipo</label>
              <select value={filtros.tipo} onChange={(e) => setFiltros({...filtros, tipo: e.target.value})} disabled={!!tipoAlertaPermitido} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="todos">Todos los tipos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Activity size={12} /> Estado</label>
              <select value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white">
                <option value="todos">Todos los estados</option>
                <option value="activa">Activa</option>
                <option value="proceso">En Proceso</option>
                <option value="cerrada">Cerrada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Layers size={12} /> Zona</label>
              <select value={filtros.zona} onChange={(e) => setFiltros({...filtros, zona: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white">
                <option value="todas">Todas las zonas</option>
                {datosPorZona.map(z => (<option key={z.zona} value={z.zona}>{z.zona}</option>))}
              </select>
            </div>
          </div>
        </div>

        {/* ✅ SECCIÓN DE UBICACIONES - VERSIÓN ESTABLE SIN MAPA */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md">
                <Map size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Ubicaciones de Incidentes</h2>
              <div className="flex items-center gap-2 ml-4">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-xs text-gray-500">Pánico</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-xs text-gray-500">Médica</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {alertasConUbicacion.length} ubicaciones disponibles
              </span>
            </div>
          </div>

          <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
            <MapPin size={64} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium mb-2">
              {alertasConUbicacion.length === 0 
                ? 'No hay ubicaciones registradas' 
                : `${alertasConUbicacion.length} ubicación${alertasConUbicacion.length !== 1 ? 'es' : ''} registradas`}
            </p>
            <div className="flex gap-4 mt-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm text-center">
                <p className="text-xs text-gray-500">Pánico</p>
                <p className="text-xl font-bold text-red-600">{alertasConUbicacion.filter(a => a.tipo === 'panico').length}</p>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm text-center">
                <p className="text-xs text-gray-500">Médica</p>
                <p className="text-xl font-bold text-green-600">{alertasConUbicacion.filter(a => a.tipo === 'medica').length}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Visualización de mapa disponible en próxima versión
            </p>
          </div>

          {alertaSeleccionada && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${alertaSeleccionada.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'}`}>
                    <IconoEntidad entidad={alertaSeleccionada.tipo === 'panico' ? 'ALERTA_PANICO' : 'ALERTA_MEDICA'} size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">Alerta #{alertaSeleccionada.id}</h3>
                      <BadgeTipoAlerta tipo={alertaSeleccionada.tipo} size={12} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alertaSeleccionada.ciudadano?.nombre || 'Ciudadano desconocido'}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><IconoEntidad entidad="UBICACION" size={12} />{alertaSeleccionada.lat?.toFixed(4)}, {alertaSeleccionada.lng?.toFixed(4)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{new Date(alertaSeleccionada.fecha_creacion).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setAlertaSeleccionada(null)} className="p-1 hover:bg-white rounded-lg"><XCircle size={18} className="text-gray-400" /></button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
          <ResumenCard label="Total Alertas" value={estadisticas.total} icon={Bell} color="indigo" />
          <ResumenCard label="Con ubicación" value={estadisticas.conUbicacion} icon={MapPin} color="green" subValue={`${Math.round(estadisticas.conUbicacion / estadisticas.total * 100) || 0}%`} />
          <ResumenCard label="Pánico" value={estadisticas.panico} icon={AlertTriangle} color="red" subValue={`${Math.round(estadisticas.panico / estadisticas.total * 100) || 0}%`} />
          <ResumenCard label="Médica" value={estadisticas.medica} icon={Heart} color="green" subValue={`${Math.round(estadisticas.medica / estadisticas.total * 100) || 0}%`} />
          <ResumenCard label="Activas" value={estadisticas.activas} icon={Activity} color="blue" />
          <ResumenCard label="En Proceso" value={estadisticas.proceso} icon={Clock} color="amber" />
          <ResumenCard label="Cerradas" value={estadisticas.cerradas} icon={CheckCircle} color="purple" />
          <ResumenCard label="Expiradas" value={estadisticas.expiradas} icon={XCircle} color="gray" />
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div ref={graficaBarrasRef} className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><div className="p-2 bg-indigo-100 rounded-xl"><BarChart3 size={20} className="text-indigo-600" /></div><h2 className="text-lg font-semibold text-gray-800">Incidentes por Zona</h2></div>
              <div className="flex items-center gap-3"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-xs text-gray-500">Pánico</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-xs text-gray-500">Médica</span></div></div>
            </div>
            {datosPorZona.length > 0 ? (
              <div className="h-80 w-full" style={{ minHeight: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorZona} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="zona" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value, name) => [value, name === 'panico' ? 'Pánico' : 'Médica']} contentStyle={{ fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="panico" name="Pánico" fill={COLORS.panico} stackId="a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="medica" name="Médica" fill={COLORS.medica} stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="h-80 flex items-center justify-center text-gray-400">No hay datos disponibles</div>}
          </div>

          <div ref={graficaPastelRef} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-100 rounded-xl"><PieChart size={20} className="text-purple-600" /></div><h2 className="text-lg font-semibold text-gray-800">Distribución por Tipo</h2></div>
            <div className="h-64 w-full" style={{ minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={[{ name: 'Pánico', value: estadisticas.panico }, { name: 'Médica', value: estadisticas.medica }]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    <Cell fill={COLORS.panico} /><Cell fill={COLORS.medica} />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-red-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Pánico</p><p className="text-lg font-bold text-red-600">{estadisticas.panico}</p></div>
              <div className="bg-green-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Médica</p><p className="text-lg font-bold text-green-600">{estadisticas.medica}</p></div>
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm"><Info size={20} className="text-indigo-600" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">Análisis basado en datos reales</h3>
              <p className="text-sm text-indigo-700">
                Este análisis utiliza las coordenadas reales de {estadisticas.conUbicacion} alertas con ubicación geográfica válida. 
                {estadisticas.sinUbicacion} alertas no tienen coordenadas y no se incluyen en el análisis por zona.
                {tipoAlertaPermitido && ` Actualmente filtrado para mostrar solo alertas de tipo ${tipoAlertaPermitido === 'panico' ? 'Pánico' : 'Médicas'}.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente simplificado de tarjeta
const ResumenCard = ({ label, value, icon: Icon, color, subValue }) => {
  const colors = {
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600',
    green: 'from-green-50 to-green-100 border-green-200 text-green-600',
    red: 'from-red-50 to-red-100 border-red-200 text-red-600',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
    gray: 'from-gray-50 to-gray-100 border-gray-200 text-gray-600',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
    amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} className={colors[color].split(' ')[2]} />
        {subValue && <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full">{subValue}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default AnalisisGeografico;