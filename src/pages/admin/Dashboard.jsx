// src/pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserCog, Bell, Users, BarChart3, FileText,
  AlertTriangle, Activity, Flame, Clock, User, MapPin, Phone,
  Truck, Ambulance, ChevronRight, AlertCircle, CheckCircle, XCircle,
  LogOut, Menu, MoreVertical, Download, Filter, Search,
  Shield, Calendar, Clock3, Map, Home, Settings, HelpCircle,
  Mail, UserCircle, LogIn, TrendingUp, TrendingDown, Minus,
  PieChart, GitPullRequest, Star, Zap, Target, Award
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import dashboardService from '../../services/admin/dashboard.service';
import { LineChart, Line, AreaChart, Area, PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import IconoEntidad, { BadgeIcono } from '../../components/ui/IconoEntidad';
import authService from '../../services/auth.service';

// Mapeo de roles a entidades para badges
const rolToEntidad = {
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  policia: 'POLICIA',
  ambulancia: 'PERSONAL_AMBULANCIA',
  operador_tecnico: 'OPERADOR_TECNICO',
  operador_policial: 'OPERADOR_POLICIAL',
  operador_medico: 'OPERADOR_MEDICO',
  operador_general: 'OPERADOR_GENERAL'
};

// Función para formatear nombres
const formatearNombre = (nombre) => {
  if (!nombre) return '';
  
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã�', para: 'Á' },
    { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã±', para: 'ñ' }, { de: 'Ã‘', para: 'Ñ' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
  ];
  
  let nombreNormalizado = nombre;
  reemplazos.forEach(({ de, para }) => {
    nombreNormalizado = nombreNormalizado.split(de).join(para);
  });
  
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

// Valores por defecto para cuando no hay datos
const defaultStats = {
  personal: { total: 0, activos: 0, inactivos: 0, disponibles: 0, noDisponibles: 0, porRol: { policia: 0, ambulancia: 0, admin: 0, superadmin: 0 } },
  unidades: { total: 0, activas: 0, inactivas: 0, disponibles: 0, ocupadas: 0, porTipo: { policia: 0, ambulancia: 0 } },
  alertas: { expiradas: 0, cerradasManual: 0, totalAlertas: 0, activas: 0, enProceso: 0, cerradasTotales: 0 },
  kpis: {
    personal: { total: 0, variacion: '0%', tendencia: 'stable' },
    unidades: { total: 0, variacion: '0%', tendencia: 'stable' },
    alertas: { total: 0, variacion: '0%', tendencia: 'stable' }
  }
};

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuthStore();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(defaultStats);
  const [alertasPorHora, setAlertasPorHora] = useState([]);
  const [actividadReciente, setActividadReciente] = useState({ personal: [], unidades: [], alertas: [] });
  const navigate = useNavigate();
  
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  const rolPersonalPermitido = authService.getRolPersonalPermitido();

  // Verificar autenticación al inicio
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('❌ No hay usuario autenticado, redirigiendo a login');
      navigate('/login');
      return;
    }
    
    if (user) {
      console.log('✅ Usuario autenticado:', user.email, 'Rol:', user.rol);
      cargarDatosDashboard();
    }
  }, [user, authLoading]);

  const cargarDatosDashboard = async () => {
    setCargando(true);
    setError(null);
    
    // Timeout de 20 segundos
    const timeoutId = setTimeout(() => {
      if (cargando) {
        setError('El dashboard está tardando en cargar. Verifica tu conexión o recarga la página.');
        setCargando(false);
      }
    }, 20000);
    
    try {
      console.log('📊 Cargando datos del dashboard...');
      console.log('📡 Filtros:', { tipoAlertaPermitido, rolPersonalPermitido });
      console.log('📡 URL API:', import.meta.env.VITE_API_URL);
      
      const params = {};
      if (tipoAlertaPermitido) params.tipo = tipoAlertaPermitido;
      if (rolPersonalPermitido) params.rol = rolPersonalPermitido;
      
      // Intentar cargar datos con manejo individual de errores
      let estadisticas = defaultStats;
      let horas = [];
      let actividad = { personal: [], unidades: [], alertas: [] };
      
      try {
        console.log('📡 Llamando a obtenerEstadisticas...');
        const result = await dashboardService.obtenerEstadisticas(params);
        console.log('✅ Estadísticas recibidas:', result);
        estadisticas = result?.success ? result : defaultStats;
      } catch (err) {
        console.error('❌ Error en estadísticas:', err);
        // Continuar con datos por defecto
      }
      
      try {
        console.log('📡 Llamando a obtenerAlertasPorHora...');
        horas = await dashboardService.obtenerAlertasPorHora(params);
        console.log('✅ Horas recibidas:', horas?.length || 0);
      } catch (err) {
        console.error('❌ Error en alertas por hora:', err);
        horas = [];
      }
      
      try {
        console.log('📡 Llamando a obtenerActividadReciente...');
        actividad = await dashboardService.obtenerActividadReciente(params);
        console.log('✅ Actividad recibida:', actividad);
      } catch (err) {
        console.error('❌ Error en actividad reciente:', err);
        actividad = { personal: [], unidades: [], alertas: [] };
      }
      
      setStats(estadisticas);
      setAlertasPorHora(Array.isArray(horas) ? horas : []);
      setActividadReciente(actividad || { personal: [], unidades: [], alertas: [] });
      
    } catch (error) {
      console.error("❌ Error cargando dashboard:", error);
      console.error("❌ Detalle completo:", error);
      setError(error.message || 'Error al cargar el dashboard');
    } finally {
      clearTimeout(timeoutId);
      setCargando(false);
    }
  };


// Componente de tarjetas - con colores consistentes
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    rose: 'from-rose-500 to-rose-600 shadow-rose-200',
    teal: 'from-teal-500 to-teal-600 shadow-teal-200',
    violet: 'from-violet-500 to-violet-600 shadow-violet-200',
    orange: 'from-orange-500 to-orange-600 shadow-orange-200'
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <div className={`p-2 md:p-3 bg-gradient-to-br ${colors[color]} rounded-lg md:rounded-xl shadow-lg`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-lg md:text-2xl font-bold text-slate-800">{value || 0}</p>
          <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-none">{subtitle}</p>
        </div>
      </div>
      <p className="text-xs md:text-sm text-slate-500 truncate">{title}</p>
    </div>
  );
};

export default Dashboard;