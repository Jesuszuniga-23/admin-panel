import { useEffect, useState, useRef } from 'react';
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

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [cargando, setCargando] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [alertasPorHora, setAlertasPorHora] = useState([]);
  const [actividadReciente, setActividadReciente] = useState({ personal: [], unidades: [], alertas: [] });
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Cargar datos del dashboard
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

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

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

  // Colores para gráficas
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-200">
                <LayoutDashboard size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-xs text-slate-500">Panel de control principal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-xl transition-all relative">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-xl transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <span className="text-white text-lg font-semibold">
                      {user?.nombre?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-800">{user?.nombre}</p>
                    <p className="text-xs text-slate-500">{user?.rol}</p>
                  </div>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user?.nombre}</p>
                      <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/admin/perfil');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircle size={16} className="text-slate-400" />
                        <span>Mi Perfil</span>
                      </button>
                      <button
                       
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Settings size={16} className="text-slate-400" />
                        <span>Configuración</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats?.kpis && Object.entries(stats.kpis).map(([key, data]) => (
            <div key={key} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${key === 'personal' ? 'bg-blue-50 text-blue-600' :
                  key === 'unidades' ? 'bg-purple-50 text-purple-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                  {key === 'personal' && <Users size={24} />}
                  {key === 'unidades' && <Truck size={24} />}
                  {key === 'alertas' && <Bell size={24} />}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getVariacionColor(data.tendencia)}`}>
                  {getVariacionIcon(data.tendencia)}
                  {data.variacion}
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">
                {key === 'alertas' ? 'Alertas Cerradas/Expiradas' : key}
              </p>
              <p className="text-3xl font-bold text-slate-800">{data.total}</p>
            </div>
          ))}
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Alertas por hora */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Actividad de Alertas</h2>
                <p className="text-xs text-slate-400">Últimas 24 horas</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Expiradas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-xs text-slate-500">Cerradas</span>
                </div>
              </div>
            </div>
            <div className="h-64">
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
                  <XAxis dataKey="hora" tickFormatter={(hora) => `${hora}:00`} />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <Tooltip />
                  <Area type="monotone" dataKey="expiradas" stroke="#3b82f6" fill="url(#expiradasGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cerradas" stroke="#f59e0b" fill="url(#cerradasGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Personal */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Distribución de Personal</h2>
            <div className="h-48">
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
                    innerRadius={40}
                    outerRadius={70}
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
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Policía: {stats?.personal?.porRol?.policia || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Ambulancia: {stats?.personal?.porRol?.ambulancia || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Admin: {stats?.personal?.porRol?.admin || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-slate-500">Super: {stats?.personal?.porRol?.superadmin || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - EXISTENTES (sin cambios) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="text-blue-600" size={24} />}
            title="Personal Activo"
            value={stats?.personal?.activos || 0}
            subtitle={`${stats?.personal?.disponibles || 0} disponibles`}
            color="blue"
          />
          <StatCard
            icon={<Truck className="text-purple-600" size={24} />}
            title="Unidades Activas"
            value={stats?.unidades?.activas || 0}
            subtitle={`${stats?.unidades?.disponibles || 0} disponibles`}
            color="purple"
          />
          <StatCard
            icon={<AlertTriangle className="text-amber-600" size={24} />}
            title="Alertas Expiradas"
            value={stats?.alertas?.expiradas || 0}
            subtitle="Sin atender"
            color="amber"
          />
          <StatCard
            icon={<CheckCircle className="text-emerald-600" size={24} />}
            title="Alertas Cerradas Manual"
            value={stats?.alertas?.cerradasManual || 0}
            subtitle="Manualmente"
            color="emerald"
          />
        </div>

        {/* NUEVAS TARJETAS - Alertas Adicionales (colores diferentes) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Clock className="text-rose-600" size={24} />}
            title="Alertas Activas"
            value={stats?.alertas?.activas || 0}
            subtitle="Sin asignar"
            color="rose"
          />
          <StatCard
            icon={<Activity className="text-teal-600" size={24} />}
            title="En Proceso"
            value={stats?.alertas?.enProceso || 0}
            subtitle="Siendo atendidas"
            color="teal"
          />
          <StatCard
            icon={<CheckCircle className="text-violet-600" size={24} />}
            title="Cerradas (Totales)"
            value={stats?.alertas?.cerradasTotales || 0}
            subtitle="Historial completo"
            color="violet"
          />
          <StatCard
            icon={<Users className="text-orange-600" size={24} />}
            title="Personal Total"
            value={stats?.personal?.total || 0}
            subtitle="Registrados"
            color="orange"
          />
        </div>

        {/* Actividad Reciente (sin cambios) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Reciente */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Personal Reciente</h2>
            <div className="space-y-3">
              {actividadReciente.personal.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <span className="text-white font-semibold">{p.nombre?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.rol} • {p.placa}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {p.disponible ? 'Disponible' : 'Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unidades Recientes */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Unidades Recientes</h2>
            <div className="space-y-3">
              {actividadReciente.unidades.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.tipo === 'policia' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}>
                      <Truck size={20} className={u.tipo === 'policia' ? 'text-blue-600' : 'text-emerald-600'} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{u.codigo}</p>
                      <p className="text-xs text-slate-400 capitalize">{u.tipo}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${u.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' :
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
    </div>
  );
};

// Componente DE TARJETAS (MEJORADO con nuevos colores)
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
    rose: 'from-rose-500 to-rose-600',
    teal: 'from-teal-500 to-teal-600',
    violet: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg shadow-${color}-200`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500">{title}</p>
    </div>
  );
};

// ANIMACION PARA LA SALIDA DE DATOS/CUANDO SE DECIDA  CAMBIAR DE COMPONENTE U OPCION
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

export default Dashboard;