// src/pages/admin/analisis/AnalisisGeografico.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, MapPin, BarChart3, PieChart, TrendingUp,
  Calendar, Filter, Download, ChevronLeft, AlertTriangle,
  Heart, Clock, Users, Truck, Bell, Info, Layers,
  XCircle, CheckCircle, Activity,
  Map, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart as RePieChart, 
  Pie, Cell, LineChart, Line
} from 'recharts';
import html2canvas from 'html2canvas';
import alertasService from '../../../services/admin/alertas.service';
import reportesService from '../../../services/admin/reportes.service';
import reportesGraficasService from '../../../services/admin/reportesGraficas.service';
import Loader from '../../../components/common/Loader';
import MapaMultiAlertas from '../../../components/maps/MapaMultiAlertas';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';

// Colores para gráficas
const COLORS = {
  panico: '#ef4444',
  medica: '#10b981',
  activa: '#3b82f6',
  proceso: '#f59e0b',
  cerrada: '#8b5cf6',
  expirada: '#6b7280'
};

const AnalisisGeografico = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Refs para capturar las gráficas y el mapa
  const graficaBarrasRef = useRef(null);
  const graficaPastelRef = useRef(null);
  const graficaTendenciasRef = useRef(null);
  const graficaEstadosRef = useRef(null);
  const mapaRef = useRef(null); // 👈 NUEVA REF PARA EL MAPA
  
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [datosPorZona, setDatosPorZona] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    conUbicacion: 0,
    sinUbicacion: 0,
    panico: 0,
    medica: 0,
    activas: 0,
    proceso: 0,
    cerradas: 0,
    expiradas: 0
  });
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: 'todos',
    estado: 'todos',
    zona: 'todas'
  });

  // Función de zonificación
  const calcularZona = (lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return 'Sin ubicación';
    if (lat > 19.6) return 'Zona Norte';
    if (lat > 19.4 && lat <= 19.6) {
      if (lng < -99.2) return 'Zona Poniente';
      if (lng > -99.0) return 'Zona Oriente';
      return 'Zona Centro';
    }
    if (lat <= 19.4) return 'Zona Sur';
    return 'Otra zona';
  };

  useEffect(() => {
    cargarDatosAnalisis();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, datosOriginales]);

  const cargarDatosAnalisis = async () => {
    setCargando(true);
    try {
      const respuesta = await alertasService.obtenerAlertasGeograficas({ limite: 5000 });
      const alertas = respuesta.data || [];
      
      setDatosOriginales(alertas);
      
      const conUbicacion = alertas.filter(a => a.lat && a.lng).length;
      setEstadisticas({
        total: alertas.length,
        conUbicacion,
        sinUbicacion: alertas.length - conUbicacion,
        panico: alertas.filter(a => a.tipo === 'panico').length,
        medica: alertas.filter(a => a.tipo === 'medica').length,
        activas: alertas.filter(a => a.estado === 'activa').length,
        proceso: alertas.filter(a => ['asignada', 'atendiendo'].includes(a.estado)).length,
        cerradas: alertas.filter(a => a.estado === 'cerrada').length,
        expiradas: alertas.filter(a => a.estado === 'expirada').length
      });

      aplicarFiltros(alertas);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = (datos = datosOriginales) => {
    let filtrados = [...datos];

    if (filtros.fechaInicio && filtros.fechaFin) {
      const inicio = new Date(filtros.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion);
        return fecha >= inicio && fecha <= fin;
      });
    }

    if (filtros.tipo !== 'todos') {
      filtrados = filtrados.filter(item => item.tipo === filtros.tipo);
    }

    if (filtros.estado !== 'todos') {
      filtrados = filtrados.filter(item => {
        if (filtros.estado === 'activa') return item.estado === 'activa';
        if (filtros.estado === 'proceso') return ['asignada', 'atendiendo'].includes(item.estado);
        if (filtros.estado === 'cerrada') return item.estado === 'cerrada';
        if (filtros.estado === 'expirada') return item.estado === 'expirada';
        return true;
      });
    }

    setDatosFiltrados(filtrados);
    procesarDatosPorZona(filtrados);
    procesarTendencias(filtrados);
  };

  const procesarDatosPorZona = (alertas) => {
    const zonas = {};

    alertas.forEach(alerta => {
      const zona = calcularZona(alerta.lat, alerta.lng);
      if (!zonas[zona]) {
        zonas[zona] = {
          zona,
          total: 0,
          panico: 0,
          medica: 0,
          activas: 0,
          enProceso: 0,
          cerradas: 0,
          expiradas: 0,
          latSum: 0,
          lngSum: 0,
          count: 0
        };
      }

      zonas[zona].total++;
      
      if (alerta.lat && alerta.lng) {
        zonas[zona].latSum += alerta.lat;
        zonas[zona].lngSum += alerta.lng;
        zonas[zona].count++;
      }

      if (alerta.tipo === 'panico') zonas[zona].panico++;
      else zonas[zona].medica++;

      if (alerta.estado === 'activa') zonas[zona].activas++;
      else if (['asignada', 'atendiendo'].includes(alerta.estado)) zonas[zona].enProceso++;
      else if (alerta.estado === 'cerrada') zonas[zona].cerradas++;
      else if (alerta.estado === 'expirada') zonas[zona].expiradas++;
    });

    const zonasArray = Object.values(zonas).map(z => ({
      ...z,
      porcentaje: Math.round((z.total / alertas.length) * 100) || 0,
      lat: z.count > 0 ? z.latSum / z.count : null,
      lng: z.count > 0 ? z.lngSum / z.count : null
    }));

    setDatosPorZona(zonasArray.sort((a, b) => b.total - a.total));
  };

  const procesarTendencias = (alertas) => {
    const meses = {};

    alertas.forEach(alerta => {
      if (!alerta.fecha_creacion) return;
      
      const fecha = new Date(alerta.fecha_creacion);
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleString('es-MX', { month: 'short', year: 'numeric' });
      
      if (!meses[mesKey]) {
        meses[mesKey] = {
          mes: mesNombre,
          mesKey,
          total: 0,
          panico: 0,
          medica: 0
        };
      }

      meses[mesKey].total++;
      if (alerta.tipo === 'panico') meses[mesKey].panico++;
      else meses[mesKey].medica++;
    });

    const tendenciasArray = Object.values(meses)
      .sort((a, b) => a.mesKey.localeCompare(b.mesKey))
      .slice(-12);

    setTendencias(tendenciasArray);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      tipo: 'todos',
      estado: 'todos',
      zona: 'todas'
    });
    setAlertaSeleccionada(null);
  };

  // =====================================================
  // FUNCIONES DE EXPORTACIÓN CON GRÁFICAS
  // =====================================================
  
  const exportarExcel = async () => {
    try {
      setExportando(true);
      toast.loading('Generando reporte de Excel...', { id: 'export' });
      
      await reportesService.generarExcelPersonalizado(
        datosFiltrados, 
        'alertas', 
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

  const capturarGraficas = async () => {
    try {
      const graficas = {};
      
      console.log('📸 Capturando elementos:', {
        mapa: mapaRef.current ? '✅ Sí' : '❌ No',
        barras: graficaBarrasRef.current ? '✅ Sí' : '❌ No',
        pastel: graficaPastelRef.current ? '✅ Sí' : '❌ No',
        tendencias: graficaTendenciasRef.current ? '✅ Sí' : '❌ No',
        estados: graficaEstadosRef.current ? '✅ Sí' : '❌ No'
      });
      
      // Capturar MAPA
      if (mapaRef.current) {
        console.log('🗺️ Capturando mapa...');
        const canvas = await html2canvas(mapaRef.current, {
          scale: 1.5,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: false,
          useCORS: true
        });
        graficas.mapa = canvas.toDataURL('image/png');
        console.log('✅ Mapa capturado');
      }
      
      // Capturar gráfica de barras
      if (graficaBarrasRef.current) {
        const canvas = await html2canvas(graficaBarrasRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        graficas.barras = canvas.toDataURL('image/png');
      }
      
      // Capturar gráfica de pastel
      if (graficaPastelRef.current) {
        const canvas = await html2canvas(graficaPastelRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        graficas.pastel = canvas.toDataURL('image/png');
      }
      
      // Capturar gráfica de tendencias
      if (graficaTendenciasRef.current) {
        const canvas = await html2canvas(graficaTendenciasRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        graficas.tendencias = canvas.toDataURL('image/png');
      }
      
      // Capturar gráfica de estados
      if (graficaEstadosRef.current) {
        const canvas = await html2canvas(graficaEstadosRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        graficas.estados = canvas.toDataURL('image/png');
      }
      
      return graficas;
    } catch (error) {
      console.error('Error capturando gráficas:', error);
      throw error;
    }
  };

  const exportarPDF = async () => {
    try {
      setExportando(true);
      toast.loading('Generando PDF con gráficas...', { id: 'export' });
      
      // Capturar todas las gráficas
      const graficas = await capturarGraficas();
      
      // Verificar que las imágenes se capturaron correctamente
      console.log('✅ Gráficas capturadas:', {
        mapa: graficas.mapa ? 'OK' : 'No',
        barras: graficas.barras ? 'OK' : 'No',
        pastel: graficas.pastel ? 'OK' : 'No',
        tendencias: graficas.tendencias ? 'OK' : 'No',
        estados: graficas.estados ? 'OK' : 'No'
      });
      
      // Llamar al servicio especializado con las gráficas
      await reportesGraficasService.generarPDFConGraficas(
        datosFiltrados,
        'alertas',
        filtros,
        user,
        {
          ...graficas,
          estadisticas,
          datosPorZona,
          tendencias
        }
      );
      
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
        
        {/* Header con gradiente */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-10"></div>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-200">
                <Globe size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Análisis Geográfico</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <MapPin size={14} className="text-indigo-500" />
                  <span>{estadisticas.conUbicacion} ubicaciones en mapa</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{datosPorZona.length} zonas identificadas</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportarExcel}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm shadow-sm hover:shadow disabled:opacity-50"
                title="Exportar a Excel"
              >
                <FileSpreadsheet size={16} />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={exportarPDF}
                disabled={exportando}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm shadow-sm hover:shadow disabled:opacity-50"
                title="Exportar a PDF con gráficas"
              >
                <FilePieChart size={16} />
                <span className="hidden sm:inline">PDF Gráficas</span>
              </button>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm shadow-sm hover:shadow"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Filter size={18} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Filtros de análisis</h2>
            {(filtros.fechaInicio || filtros.fechaFin || filtros.tipo !== 'todos' || filtros.estado !== 'todos') && (
              <button
                onClick={limpiarFiltros}
                className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Desde
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> Hasta
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <AlertTriangle size={12} /> Tipo
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              >
                <option value="todos">Todos los tipos</option>
                <option value="panico">Pánico</option>
                <option value="medica">Médica</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Activity size={12} /> Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="activa">Activa</option>
                <option value="proceso">En Proceso</option>
                <option value="cerrada">Cerrada</option>
                <option value="expirada">Expirada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Layers size={12} /> Zona
              </label>
              <select
                value={filtros.zona}
                onChange={(e) => setFiltros({...filtros, zona: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              >
                <option value="todas">Todas las zonas</option>
                {datosPorZona.map(z => (
                  <option key={z.zona} value={z.zona}>{z.zona}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* MAPA PRINCIPAL - CON REF */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
                <Map size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Mapa de Incidentes</h2>
              <div className="flex items-center gap-2 ml-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Pánico</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Médica</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                {datosFiltrados.filter(a => a.lat && a.lng).length} puntos visibles
              </span>
            </div>
          </div>

          {/* 👇 REF DEL MAPA AGREGADA AQUÍ */}
          <div ref={mapaRef} className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
            <MapaMultiAlertas 
              alertas={datosFiltrados.filter(a => a.lat && a.lng)}
              onSeleccionarAlerta={setAlertaSeleccionada}
            />
          </div>

          {alertaSeleccionada && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    alertaSeleccionada.tipo === 'panico' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {alertaSeleccionada.tipo === 'panico' 
                      ? <AlertTriangle size={16} className="text-red-600" />
                      : <Heart size={16} className="text-green-600" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">
                        Alerta #{alertaSeleccionada.id}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        alertaSeleccionada.estado === 'activa' ? 'bg-blue-100 text-blue-700' :
                        alertaSeleccionada.estado === 'cerrada' ? 'bg-purple-100 text-purple-700' :
                        alertaSeleccionada.estado === 'expirada' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {alertaSeleccionada.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {alertaSeleccionada.ciudadano?.nombre || 'Ciudadano desconocido'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {alertaSeleccionada.lat?.toFixed(4)}, {alertaSeleccionada.lng?.toFixed(4)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(alertaSeleccionada.fecha_creacion).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAlertaSeleccionada(null)}
                  className="p-1 hover:bg-white rounded-lg transition-colors"
                >
                  <XCircle size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
          <ResumenCardAvanzado 
            label="Total Alertas" 
            value={estadisticas.total} 
            icon={Bell} 
            color="indigo"
          />
          <ResumenCardAvanzado 
            label="Con ubicación" 
            value={estadisticas.conUbicacion} 
            icon={MapPin} 
            color="green"
            subValue={`${Math.round(estadisticas.conUbicacion / estadisticas.total * 100) || 0}%`}
          />
          <ResumenCardAvanzado 
            label="Pánico" 
            value={estadisticas.panico} 
            icon={AlertTriangle} 
            color="red"
            subValue={`${Math.round(estadisticas.panico / estadisticas.total * 100) || 0}%`}
          />
          <ResumenCardAvanzado 
            label="Médica" 
            value={estadisticas.medica} 
            icon={Heart} 
            color="green"
            subValue={`${Math.round(estadisticas.medica / estadisticas.total * 100) || 0}%`}
          />
          <ResumenCardAvanzado 
            label="Activas" 
            value={estadisticas.activas} 
            icon={Activity} 
            color="blue"
          />
          <ResumenCardAvanzado 
            label="En Proceso" 
            value={estadisticas.proceso} 
            icon={Clock} 
            color="amber"
          />
          <ResumenCardAvanzado 
            label="Cerradas" 
            value={estadisticas.cerradas} 
            icon={CheckCircle} 
            color="purple"
          />
          <ResumenCardAvanzado 
            label="Expiradas" 
            value={estadisticas.expiradas} 
            icon={XCircle} 
            color="gray"
          />
        </div>

        {/* Gráficas - CON REFS PARA CAPTURAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfica de barras */}
          <div ref={graficaBarrasRef} className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <BarChart3 size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Incidentes por Zona</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Pánico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Médica</span>
                </div>
              </div>
            </div>
            {datosPorZona.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={datosPorZona}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="zona" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      formatter={(value, name) => {
                        const nombres = { panico: 'Pánico', medica: 'Médica' };
                        return [value, nombres[name] || name];
                      }}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="panico" name="Pánico" fill={COLORS.panico} stackId="a" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="medica" name="Médica" fill={COLORS.medica} stackId="a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </div>

          {/* Gráfica de pastel */}
          <div ref={graficaPastelRef} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <PieChart size={20} className="text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Distribución por Tipo</h2>
            </div>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Pánico', value: estadisticas.panico },
                      { name: 'Médica', value: estadisticas.medica }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    <Cell fill={COLORS.panico} />
                    <Cell fill={COLORS.medica} />
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-red-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Pánico</p>
                <p className="text-lg font-bold text-red-600">{estadisticas.panico}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Médica</p>
                <p className="text-lg font-bold text-green-600">{estadisticas.medica}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid secundario */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tendencias mensuales */}
          <div ref={graficaTendenciasRef} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-xl">
                <TrendingUp size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Tendencias Mensuales</h2>
            </div>
            {tendencias.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tendencias}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="panico" name="Pánico" stroke={COLORS.panico} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="medica" name="Médica" stroke={COLORS.medica} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No hay datos de tendencias
              </div>
            )}
          </div>

          {/* Distribución por estado */}
          <div ref={graficaEstadosRef} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Activity size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Distribución por Estado</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { estado: 'Activas', valor: estadisticas.activas },
                    { estado: 'Proceso', valor: estadisticas.proceso },
                    { estado: 'Cerradas', valor: estadisticas.cerradas },
                    { estado: 'Expiradas', valor: estadisticas.expiradas }
                  ]}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="estado" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {[
                      { fill: '#3b82f6' },
                      { fill: '#f59e0b' },
                      { fill: '#8b5cf6' },
                      { fill: '#6b7280' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} {...entry} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabla detallada */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-xl">
              <Layers size={20} className="text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Detalle de Incidentes por Zona</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Zona</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Pánico</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Médica</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">%</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Activas</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Proceso</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Cerradas</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Expiradas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {datosPorZona.map((zona, index) => (
                  <tr 
                    key={zona.zona} 
                    className={`hover:bg-indigo-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    onClick={() => setFiltros({...filtros, zona: zona.zona})}
                  >
                    <td className="px-6 py-4 font-medium">{zona.zona}</td>
                    <td className="px-6 py-4 text-center font-semibold">{zona.total}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {zona.panico}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {zona.medica}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-indigo-600">{zona.porcentaje}%</td>
                    <td className="px-6 py-4 text-center text-blue-600">{zona.activas}</td>
                    <td className="px-6 py-4 text-center text-amber-600">{zona.enProceso}</td>
                    <td className="px-6 py-4 text-center text-purple-600">{zona.cerradas}</td>
                    <td className="px-6 py-4 text-center text-gray-600">{zona.expiradas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Info size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-indigo-900 mb-1">Análisis basado en datos reales</h3>
              <p className="text-sm text-indigo-700">
                Este análisis utiliza las coordenadas reales de {estadisticas.conUbicacion} alertas 
                con ubicación geográfica válida. {estadisticas.sinUbicacion} alertas no tienen coordenadas 
                y no se incluyen en el análisis por zona.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de tarjeta de resumen avanzada
const ResumenCardAvanzado = ({ label, value, icon: Icon, color, subValue }) => {
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
        {subValue && (
          <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full">
            {subValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default AnalisisGeografico;