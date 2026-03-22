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

// Mapeo de roles a entidades para badges
const rolToEntidad = {
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  policia: 'POLICIA',
  ambulancia: 'PERSONAL_AMBULANCIA'
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

const Dashboard = () => {
  const { user } = useAuthStore();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState(null);
  const [alertasPorHora, setAlertasPorHora] = useState([]);
  const [actividadReciente, setActividadReciente] = useState({ personal: [], unidades: [], alertas: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const cargarDatosDashboard = async () => {
      setCargando(true);
      try {
        const [estadisticas, horas, actividad] = await Promise.all([
          dashboardService.obtenerEstadisticas(),
          dashboardService.obtenerAlertasPorHora(),
          dashboardService.obtenerActividadReciente()
        ]);

        setStats(estadisticas);
        setAlertasPorHora(horas);
        setActividadReciente(actividad);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosDashboard();
  }, []);

  const getVariacionColor = (tendencia) => {
    switch (tendencia) {
      case 'up': return 'text-emerald-600 bg-emerald-50';
      case 'down': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVariacionIcon = (tendencia) => {
    switch (tendencia) {
      case 'up': return <TrendingUp size={14} />;
      case 'down': return <TrendingDown size={14} />;
      default: return <Minus size={14} />;
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="relative text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="p-4 sm:p-6 md:p-8">
        {/* KPIs - GRID RESPONSIVE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats?.kpis && Object.entries(stats.kpis).map(([key, data]) => (
            <div key={key} className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className={`p-2 md:p-3 rounded-xl ${
                  key === 'personal' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200' :
                  key === 'unidades' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-200' :
                  'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200'
                }`}>
                  {key === 'personal' && <Users size={20} className="md:w-6 md:h-6" />}
                  {key === 'unidades' && <Truck size={20} className="md:w-6 md:h-6" />}
                  {key === 'alertas' && <Bell size={20} className="md:w-6 md:h-6" />}
                </div>
                <div className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium ${getVariacionColor(data.tendencia)}`}>
                  {getVariacionIcon(data.tendencia)}
                  {data.variacion}
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mb-1">
                {key === 'alertas' ? 'Alertas Cerradas/Expiradas' : key}
              </p>
              <p className="text-xl md:text-3xl font-bold text-slate-800">{data.total}</p>
            </div>
          ))}
        </div>

        {/* Gráficas - GRID RESPONSIVE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Alertas por hora */}
          <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Actividad de Alertas</h2>
                <p className="text-xs text-slate-400">Últimas 24 horas</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Expiradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Cerradas</span>
                </div>
              </div>
            </div>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={alertasPorHora}>
                  <defs>
                    <linearGradient id="expiradasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cerradasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hora" tickFormatter={(hora) => `${hora}:00`} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Area type="monotone" dataKey="expiradas" stroke="#3b82f6" fill="url(#expiradasGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cerradas" stroke="#f59e0b" fill="url(#cerradasGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Personal */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4 md:mb-6">Distribución de Personal</h2>
            <div className="h-36 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Policía', value: stats?.personal?.porRol?.policia || 0 },
                      { name: 'Ambulancia', value: stats?.personal?.porRol?.ambulancia || 0 },
                      { name: 'Admin', value: stats?.personal?.porRol?.admin || 0 },
                      { name: 'Super Admin', value: stats?.personal?.porRol?.superadmin || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 md:mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Policía: {stats?.personal?.porRol?.policia || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Ambulancia: {stats?.personal?.porRol?.ambulancia || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Admin: {stats?.personal?.porRol?.admin || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Super: {stats?.personal?.porRol?.superadmin || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - con iconos mejorados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            icon={<IconoEntidad entidad="POLICIA" size={20} />}
            title="Personal Activo"
            value={stats?.personal?.activos || 0}
            subtitle={`${stats?.personal?.disponibles || 0} disponibles`}
            color="blue"
          />
          <StatCard
            icon={<IconoEntidad entidad="PATRULLA" size={20} />}
            title="Unidades Activas"
            value={stats?.unidades?.activas || 0}
            subtitle={`${stats?.unidades?.disponibles || 0} disponibles`}
            color="purple"
          />
          <StatCard
            icon={<IconoEntidad entidad="ALERTA_PANICO" size={20} />}
            title="Alertas Expiradas"
            value={stats?.alertas?.expiradas || 0}
            subtitle="Sin atender"
            color="amber"
          />
          <StatCard
            icon={<IconoEntidad entidad="ALERTA_CERRADA" size={20} />}
            title="Alertas Cerradas Manual"
            value={stats?.alertas?.cerradasManual || 0}
            subtitle="Manualmente"
            color="emerald"
          />
        </div>

        {/* NUEVAS TARJETAS - con iconos mejorados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            icon={<IconoEntidad entidad="ALERTA_PANICO" size={20} />}
            title="Alertas Activas"
            value={stats?.alertas?.activas || 0}
            subtitle="Sin asignar"
            color="rose"
          />
          <StatCard
            icon={<IconoEntidad entidad="ALERTA_EN_PROCESO" size={20} />}
            title="En Proceso"
            value={stats?.alertas?.enProceso || 0}
            subtitle="Siendo atendidas"
            color="teal"
          />
          <StatCard
            icon={<IconoEntidad entidad="ALERTA_CERRADA" size={20} />}
            title="Cerradas (Totales)"
            value={stats?.alertas?.cerradasTotales || 0}
            subtitle="Historial completo"
            color="violet"
          />
          <StatCard
            icon={<IconoEntidad entidad="CIUDADANO" size={20} />}
            title="Personal Total"
            value={stats?.personal?.total || 0}
            subtitle="Registrados"
            color="orange"
          />
        </div>

        {/* Actividad Reciente - con BadgeIcono */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Personal Reciente */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Personal Reciente</h2>
            <div className="space-y-2 md:space-y-3">
              {actividadReciente.personal.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-lg md:rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                      <span className="text-white text-xs md:text-sm font-semibold">
                        {p.nombre?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-800 truncate">{formatearNombre(p.nombre)}</p>
                      <BadgeIcono entidad={rolToEntidad[p.rol] || 'ADMIN'} texto={p.rol} size={10} />
                    </div>
                  </div>
                  <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${
                    p.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.disponible ? 'Disponible' : 'Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unidades Recientes */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">Unidades Recientes</h2>
            <div className="space-y-2 md:space-y-3">
              {actividadReciente.unidades.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-lg md:rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      u.tipo === 'policia' ? 'bg-blue-100' : 'bg-emerald-100'
                    }`}>
                      <IconoEntidad 
                        entidad={u.tipo === 'policia' ? 'PATRULLA' : 'AMBULANCIA'} 
                        size={16} 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-slate-800 truncate">{u.codigo}</p>
                      <p className="text-xs text-slate-400 capitalize truncate">{u.tipo}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${
                    u.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' :
                    u.estado === 'ocupada' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {u.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
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
          <p className="text-lg md:text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-none">{subtitle}</p>
        </div>
      </div>
      <p className="text-xs md:text-sm text-slate-500 truncate">{title}</p>
    </div>
  );
};

export default Dashboard;