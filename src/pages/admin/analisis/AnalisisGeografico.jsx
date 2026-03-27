// src/pages/admin/analisis/AnalisisGeografico.jsx
// VERSIÓN SIMPLIFICADA - SIN EFECTOS COMPLEJOS

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Filter, ChevronLeft, AlertTriangle,
  Heart, Clock, Bell, Info, Layers, XCircle, CheckCircle, Activity,
  Map, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import analisisGeograficoService from '../../../services/admin/analisisGeografico.service';
import reportesService from '../../../services/admin/reportes.service';
import Loader from '../../../components/common/Loader';
import useAuthStore from '../../../store/authStore';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeTipoAlerta } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';

const AnalisisGeografico = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [alertasFiltradas, setAlertasFiltradas] = useState([]);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0, conUbicacion: 0, sinUbicacion: 0,
    panico: 0, medica: 0, activas: 0, proceso: 0, cerradas: 0, expiradas: 0
  });
  const [zonas, setZonas] = useState([]);
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: tipoAlertaPermitido || 'todos',
    estado: 'todos',
    zona: 'todas'
  });

  // Función para calcular zona
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

  // Función para aplicar filtros
  const aplicarFiltros = (datos) => {
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
    
    if (filtros.zona !== 'todas') {
      filtrados = filtrados.filter(item => {
        const zona = calcularZona(item.lat, item.lng);
        return zona === filtros.zona;
      });
    }
    
    return filtrados;
  };

  // Función para calcular estadísticas
  const calcularEstadisticas = (datos) => {
    const conUbicacion = datos.filter(a => a.lat && a.lng).length;
    return {
      total: datos.length,
      conUbicacion,
      sinUbicacion: datos.length - conUbicacion,
      panico: datos.filter(a => a.tipo === 'panico').length,
      medica: datos.filter(a => a.tipo === 'medica').length,
      activas: datos.filter(a => a.estado === 'activa').length,
      proceso: datos.filter(a => ['asignada', 'atendiendo'].includes(a.estado)).length,
      cerradas: datos.filter(a => a.estado === 'cerrada').length,
      expiradas: datos.filter(a => a.estado === 'expirada').length
    };
  };

  // Función para procesar zonas
  const procesarZonas = (datos) => {
    const zonasMap = {};
    datos.forEach(alerta => {
      if (!alerta.lat || !alerta.lng) return;
      const zona = calcularZona(alerta.lat, alerta.lng);
      if (!zonasMap[zona]) {
        zonasMap[zona] = { zona, total: 0, panico: 0, medica: 0 };
      }
      zonasMap[zona].total++;
      if (alerta.tipo === 'panico') zonasMap[zona].panico++;
      else zonasMap[zona].medica++;
    });
    return Object.values(zonasMap).sort((a, b) => b.total - a.total);
  };

  // Cargar datos UNA SOLA VEZ
  useEffect(() => {
    const cargarDatos = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setCargando(true);
      
      try {
        const params = { signal: abortControllerRef.current.signal, limite: 5000 };
        if (tipoAlertaPermitido) params.tipo = tipoAlertaPermitido;
        
        const response = await analisisGeograficoService.obtenerDatosCompletos(params);
        
        if (!isMountedRef.current) return;
        
        if (response.success && response.alertas) {
          setAlertas(response.alertas);
          
          // Aplicar filtros iniciales
          const filtrados = aplicarFiltros(response.alertas);
          setAlertasFiltradas(filtrados);
          setEstadisticas(calcularEstadisticas(filtrados));
          setZonas(procesarZonas(filtrados));
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
    };
    
    isMountedRef.current = true;
    cargarDatos();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tipoAlertaPermitido]); // Solo se ejecuta UNA VEZ

  // Aplicar filtros cuando cambian
  useEffect(() => {
    if (alertas.length === 0) return;
    
    const filtrados = aplicarFiltros(alertas);
    setAlertasFiltradas(filtrados);
    setEstadisticas(calcularEstadisticas(filtrados));
    setZonas(procesarZonas(filtrados));
  }, [filtros, alertas]); // Dependencias correctas

  const alertasConUbicacion = alertasFiltradas.filter(a => a.lat && a.lng);

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

  const exportarExcel = async () => {
    setExportando(true);
    try {
      toast.loading('Generando reporte...', { id: 'export' });
      await reportesService.generarExcelPersonalizado(alertasFiltradas, 'alertas', filtros, user);
      toast.success('Reporte generado', { id: 'export' });
    } catch (error) {
      toast.error('Error al generar reporte', { id: 'export' });
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
                  <span>{zonas.length} zonas identificadas</span>
                  {tipoAlertaPermitido && (
                    <span className="text-indigo-600">Filtrado: {tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={exportarExcel} disabled={exportando} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm shadow-md disabled:opacity-50">
                <FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span>
              </button>
              <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm shadow-sm">
                <ChevronLeft size={16} /><span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-100 rounded-lg"><Filter size={18} className="text-indigo-600" /></div>
            <h2 className="text-base font-semibold text-gray-800">Filtros</h2>
            <button onClick={limpiarFiltros} className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full">Limpiar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})} placeholder="Desde" className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50" />
            <input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})} placeholder="Hasta" className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50" />
            <select value={filtros.tipo} onChange={(e) => setFiltros({...filtros, tipo: e.target.value})} disabled={!!tipoAlertaPermitido} className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50">
              <option value="todos">Todos</option>
              <option value="panico">Pánico</option>
              <option value="medica">Médica</option>
            </select>
            <select value={filtros.estado} onChange={(e) => setFiltros({...filtros, estado: e.target.value})} className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50">
              <option value="todos">Todos</option>
              <option value="activa">Activa</option>
              <option value="proceso">En Proceso</option>
              <option value="cerrada">Cerrada</option>
            </select>
            <select value={filtros.zona} onChange={(e) => setFiltros({...filtros, zona: e.target.value})} className="px-3 py-2.5 border rounded-xl text-sm bg-gray-50">
              <option value="todas">Todas</option>
              {zonas.map(z => <option key={z.zona} value={z.zona}>{z.zona}</option>)}
            </select>
          </div>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
          <ResumenCard label="Total" value={estadisticas.total} icon={Bell} color="indigo" />
          <ResumenCard label="Con ubicación" value={estadisticas.conUbicacion} icon={MapPin} color="green" />
          <ResumenCard label="Pánico" value={estadisticas.panico} icon={AlertTriangle} color="red" />
          <ResumenCard label="Médica" value={estadisticas.medica} icon={Heart} color="green" />
          <ResumenCard label="Activas" value={estadisticas.activas} icon={Activity} color="blue" />
          <ResumenCard label="En Proceso" value={estadisticas.proceso} icon={Clock} color="amber" />
          <ResumenCard label="Cerradas" value={estadisticas.cerradas} icon={CheckCircle} color="purple" />
          <ResumenCard label="Expiradas" value={estadisticas.expiradas} icon={XCircle} color="gray" />
        </div>

        {/* Tabla de zonas */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Zona</h2>
          {zonas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Zona</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Pánico</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Médica</th></tr>
                </thead>
                <tbody>
                  {zonas.map((zona, i) => (
                    <tr key={zona.zona} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm font-medium">{zona.zona}</td>
                      <td className="px-6 py-4 text-sm">{zona.total}</td>
                      <td className="px-6 py-4 text-sm text-red-600">{zona.panico}</td>
                      <td className="px-6 py-4 text-sm text-green-600">{zona.medica}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="text-center py-8 text-gray-400">No hay datos</div>}
        </div>
      </div>
    </div>
  );
};

const ResumenCard = ({ label, value, icon: Icon, color }) => {
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
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={18} className={colors[color].split(' ')[2]} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

export default AnalisisGeografico;