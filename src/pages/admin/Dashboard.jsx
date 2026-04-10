import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, Truck, BookUser,
  AlertTriangle, Activity, Clock, User, Phone,
  ChevronRight, AlertCircle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import TenantStatusBanner from '../../components/admin/TenantStatusBanner';
import tenantService from '../../services/admin/tenant.service';
import useAuthStore from '../../store/authStore';
import { AreaChart, Area, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import IconoEntidad, { BadgeIcono } from '../../components/ui/IconoEntidad';
import authService from '../../services/auth.service';
import { useDashboardCache } from '../../hooks/useDashboardCache';
import ConsumoPlan from '../../components/admin/ConsumoPlan';


// Mapeo de roles a entidades para badges
const rolToEntidad = {
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  policia: 'POLICIA',
  paramedico: 'PARAMEDICO',
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
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
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

// Valores por defecto
const defaultData = {
  personal: { total: 0, activos: 0, inactivos: 0, disponibles: 0, noDisponibles: 0, porRol: { policia: 0, paramedico: 0, admin: 0, superadmin: 0 } },
  unidades: { total: 0, activas: 0, inactivas: 0, disponibles: 0, ocupadas: 0, porTipo: { patrulla: 0, ambulancia: 0 } },
  alertas: { expiradas: 0, cerradasManual: 0, totalAlertas: 0, activas: 0, enProceso: 0, cerradasTotales: 0 },
  periodoAnterior: {
    personal: { total: 0 },
    unidades: { total: 0 },
    alertas: { totalAlertas: 0 }
  },
  actividadReciente: { personal: [], unidades: [], alertas: [] },
  alertasPorHora: []
};

// ✅ Función para calcular variación
const calcularVariacion = (actual, anterior) => {
  if (!anterior || anterior === 0) {
    return { variacion: '0%', tendencia: 'stable' };
  }
  const porcentaje = ((actual - anterior) / anterior) * 100;
  const variacion = `${Math.abs(Math.round(porcentaje))}%`;
  const tendencia = porcentaje > 0 ? 'up' : porcentaje < 0 ? 'down' : 'stable';
  return { variacion, tendencia };
};

// Componente de tarjeta principal (KPIs)
const KpiCard = ({ icon, title, value, variacion, tendencia, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200'
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

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className={`p-2 md:p-3 bg-gradient-to-r ${colors[color]} rounded-xl shadow-lg`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium ${getVariacionColor(tendencia)}`}>
          {getVariacionIcon(tendencia)}
          {variacion}
        </div>
      </div>
      <p className="text-xs md:text-sm text-slate-500 mb-1">{title}</p>
      <p className="text-xl md:text-3xl font-bold text-slate-800">{value || 0}</p>
    </div>
  );
};

// Componente de tarjeta secundaria (Stats Cards)
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    rose: 'from-rose-500 to-rose-600 shadow-rose-200',
    teal: 'from-teal-500 to-teal-600 shadow-teal-200',
    violet: 'from-violet-500 to-violet-600 shadow-violet-200',
    orange: 'from-orange-500 to-orange-600 shadow-orange-200',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    green: 'from-green-500 to-green-600 shadow-green-200',
    gray: 'from-gray-500 to-gray-600 shadow-gray-200'
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <div className={`p-2 md:p-3 bg-gradient-to-r ${colors[color]} rounded-lg md:rounded-xl shadow-lg`}>
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

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data, loading, error, cached, recargar } = useDashboardCache();
  const [stats, setStats] = useState(defaultData);
  const [alertasPorHora, setAlertasPorHora] = useState([]);
  const [actividadReciente, setActividadReciente] = useState({ personal: [], unidades: [], alertas: [] });
  const [tenantInfo, setTenantInfo] = useState(null);
  const navigate = useNavigate();
  // ✅ REDIRIGIR SUPERADMIN AL DASHBOARD DE CONTROL
  useEffect(() => {
    if (user?.rol === 'superadmin') {
      console.log('🔴 Superadmin detectado, redirigiendo a /superadmin/dashboard');
      navigate('/superadmin/dashboard', { replace: true });
    }
  }, [user, navigate]);
  // ✅ NUEVO: Cargar información del tenant cuando el usuario está autenticado
  useEffect(() => {
    const cargarTenantInfo = async () => {
      // Solo cargar si hay usuario y NO es superadmin (superadmin tiene su propio dashboard)
      if (user && user.rol !== 'superadmin') {
        try {
          // Obtener tenant_id del usuario o del store
          const tenantId = user.tenant_id || localStorage.getItem('tenant_id');

          if (tenantId) {
            const response = await tenantService.obtenerTenant(tenantId);
            if (response.success && response.data) {
              setTenantInfo(response.data);
            }
          }
        } catch (error) {
          console.error('Error cargando info del tenant:', error);
          // No mostrar error al usuario, solo log
        }
      }
    };

    cargarTenantInfo();
  }, [user]);

  // ✅ OBTENER FILTROS CORRECTOS
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
  const rolPersonalPermitido = authService.getRolPersonalPermitido();
  const tipoUnidadPermitido = authService.getTipoUnidadPermitido();  // ✅ AGREGADO

  // ✅ Determinar qué tarjetas mostrar según rol
  const mostrarTarjetaPanico = !tipoAlertaPermitido || tipoAlertaPermitido === 'panico';
  const mostrarTarjetaMedica = !tipoAlertaPermitido || tipoAlertaPermitido === 'medica';

  // ✅ CORREGIDO: Colores dinámicos según TIPO DE UNIDAD
  const getColorsByRol = useCallback(() => {
    if (tipoUnidadPermitido === 'patrulla') {
      return {
        personal: 'blue',
        unidades: 'indigo',
        neutral: 'blue'
      };
    }
    if (tipoUnidadPermitido === 'ambulancia') {
      return {
        personal: 'green',
        unidades: 'emerald',
        neutral: 'green'
      };
    }
    return {
      personal: 'gray',
      unidades: 'gray',
      neutral: 'gray'
    };
  }, [tipoUnidadPermitido]);

  const coloresPorRol = getColorsByRol();

  const getVariacionColor = useCallback((tendencia) => {
    switch (tendencia) {
      case 'up': return 'text-emerald-600 bg-emerald-50';
      case 'down': return 'text-rose-600 bg-rose-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);

  const getVariacionIcon = useCallback((tendencia) => {
    switch (tendencia) {
      case 'up': return <TrendingUp size={14} />;
      case 'down': return <TrendingDown size={14} />;
      default: return <Minus size={14} />;
    }
  }, []);

  const getPersonalDistributionData = useCallback(() => {
    const porRol = stats?.personal?.porRol || {};

    // Si hay filtro por rol, mostrar solo ese
    if (rolPersonalPermitido === 'policia') {
      return [{ name: 'Policía', value: porRol.policia || 0 }];
    }
    if (rolPersonalPermitido === 'paramedico') {
      return [{ name: 'Paramédico', value: porRol.paramedico || 0 }];
    }

    // ✅ MOSTRAR TODOS LOS ROLES QUE TIENEN PERSONAL
    const nombresRol = {
      'policia': 'Policía',
      'paramedico': 'Paramédico',
      'admin': 'Admin',
      'superadmin': 'Super Admin',
      'operador_tecnico': 'Op. Técnico',
      'operador_medico': 'Op. Médico',
      'operador_policial': 'Op. Policial',
      'operador_general': 'Op. General'
    };

    // Convertir el objeto porRol a array y filtrar los que tienen valor > 0
    return Object.entries(porRol)
      .filter(([_, value]) => value > 0)
      .map(([rol, value]) => ({
        name: nombresRol[rol] || rol,
        value
      }));
  }, [rolPersonalPermitido, stats?.personal?.porRol]);

  const COLORS = useMemo(() => ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'], []);

  // ✅ Actualizar estado cuando llegan los datos
  useEffect(() => {
    if (data) {
      const periodoAnterior = data.periodoAnterior || {};

      setStats({
        personal: data.personal || defaultData.personal,
        unidades: data.unidades || defaultData.unidades,
        alertas: data.alertas || defaultData.alertas,
        periodoAnterior: periodoAnterior,
        kpis: {
          personal: {
            total: data.personal?.total || 0,
            ...calcularVariacion(
              data.personal?.total || 0,
              periodoAnterior.personal?.total || 0
            )
          },
          unidades: {
            total: data.unidades?.total || 0,
            ...calcularVariacion(
              data.unidades?.total || 0,
              periodoAnterior.unidades?.total || 0
            )
          },
          alertas: {
            total: data.alertas?.totalAlertas || 0,
            ...calcularVariacion(
              data.alertas?.totalAlertas || 0,
              periodoAnterior.alertas?.totalAlertas || 0
            )
          }
        }
      });

      setAlertasPorHora(data.alertasPorHora || []);
      setActividadReciente(data.actividadReciente || { personal: [], unidades: [], alertas: [] });
    }
  }, [data]);

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const personalDistributionData = useMemo(() => getPersonalDistributionData(), [getPersonalDistributionData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-red-50 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error al cargar el dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => recargar()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="relative text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">
            {cached ? 'Cargando datos actualizados...' : 'Cargando dashboard...'}
          </p>
          {cached && (
            <p className="text-xs text-slate-400 mt-1">Mostrando datos en caché</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="p-4 sm:p-6 md:p-8">
        {/* ✅ NUEVO: BANNER DE ESTADO DEL TENANT */}
        <TenantStatusBanner tenant={tenantInfo} />
        {/* ✅ NUEVO: CONSUMO DEL PLAN */}
        {tenantInfo && <ConsumoPlan tenantId={tenantInfo.id} />}

        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats?.kpis && Object.entries(stats.kpis).map(([key, data]) => {
            const titulo =
              key === 'personal' ? 'Personal' :
                key === 'unidades' ? 'Unidades' :
                  key === 'alertas' ? 'Alertas cerradas/expiradas' :
                    key.charAt(0).toUpperCase() + key.slice(1);

            const icono =
              key === 'personal' ? <Users size={20} className="md:w-6 md:h-6 text-white" /> :
                key === 'unidades' ? <Truck size={20} className="md:w-6 md:h-6 text-white" /> :
                  <Bell size={20} className="md:w-6 md:h-6 text-white" />;

            const color =
              key === 'personal' ? 'blue' :
                key === 'unidades' ? 'purple' :
                  'amber';

            return (
              <KpiCard
                key={key}
                icon={icono}
                title={titulo}
                value={data.total || 0}
                variacion={data.variacion}
                tendencia={data.tendencia}
                color={color}
              />
            );
          })}
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Alertas por hora */}
          <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Actividad de Alertas</h2>
                <p className="text-xs text-slate-400">
                  Últimas 24 horas
                  {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
                </p>
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
            {alertasPorHora.length > 0 ? (
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
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                No hay datos disponibles
              </div>
            )}
          </div>

          {/* Distribución de Personal */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4 md:mb-6">
              Distribución de Personal
              {rolPersonalPermitido === 'policia' && ' (Solo Policía)'}
              {rolPersonalPermitido === 'paramedico' && ' (Solo Paramédico)'}
            </h2>
            <div className="h-36 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={personalDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {personalDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 md:mt-4">
              {personalDistributionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full`} style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-xs text-slate-500">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards - Personal y Unidades (detalle operativo) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Personal Activo */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-2 md:mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200">
                <Users size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-bold text-slate-800">{stats?.personal?.activos || 0}</p>
                <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-none">{stats?.personal?.disponibles || 0} disponibles</p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-500 truncate">Personal Activo</p>
          </div>

          {/* Unidades Activas */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-2 md:mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-purple-200">
                <Truck size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-bold text-slate-800">{stats?.unidades?.activas || 0}</p>
                <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-none">{stats?.unidades?.disponibles || 0} disponibles</p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-500 truncate">Unidades Activas</p>
          </div>

          {/* Alertas Activas */}
          <StatCard
            icon={<Bell size={20} className="text-white" />}
            title="Alertas Activas"
            value={stats?.alertas?.activas || 0}
            subtitle="Sin asignar"
            color="rose"
          />

          {/* Alertas Cerradas Manual */}
          <StatCard
            icon={<XCircle size={20} className="text-white" />}
            title="Cerradas Manual"
            value={stats?.alertas?.cerradasManual || 0}
            subtitle="Manualmente"
            color="purple"
          />
        </div>

        {/* Stats Cards - Ciclo de vida de alertas + Personal Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Alertas en Proceso */}
          {mostrarTarjetaPanico && (
            <StatCard
              icon={<Activity size={20} className="text-white" />}
              title="En Proceso"
              value={stats?.alertas?.enProceso || 0}
              subtitle="Siendo atendidas"
              color="amber"
            />
          )}

          {/* Alertas Cerradas Totales */}
          {mostrarTarjetaPanico && (
            <StatCard
              icon={<CheckCircle size={20} className="text-white" />}
              title="Cerradas (Totales)"
              value={stats?.alertas?.cerradasTotales || 0}
              subtitle="Historial completo"
              color="emerald"
            />
          )}

          {/* Alertas Expiradas */}
          <StatCard
            icon={<AlertTriangle size={20} className="text-white" />}
            title="Alertas Expiradas"
            value={stats?.alertas?.expiradas || 0}
            subtitle="Sin atender"
            color="gray"
          />

          {/* Personal Total */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-2 md:mb-4">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-teal-200">
                <BookUser size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-lg md:text-2xl font-bold text-slate-800">{stats?.personal?.total || 0}</p>
                <p className="text-xs text-slate-400 truncate max-w-[80px] md:max-w-none">Registrados</p>
              </div>
            </div>
            <p className="text-xs md:text-sm text-slate-500 truncate">Personal Total</p>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Personal Reciente */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">
              Personal Reciente
              {rolPersonalPermitido === 'policia' && ' (Solo Policía)'}
              {rolPersonalPermitido === 'paramedico' && ' (Solo Paramédico)'}
            </h2>
            {actividadReciente.personal && actividadReciente.personal.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {actividadReciente.personal
                  .filter(p => !rolPersonalPermitido || p.rol === rolPersonalPermitido)
                  .map((p) => (
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
                      <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${p.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {p.disponible ? 'Disponible' : 'Ocupado'}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No hay datos recientes</p>
            )}
          </div>

          {/* ✅ CORREGIDO: Unidades Recientes - Filtro con tipoUnidadPermitido */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-3 md:mb-4">
              Unidades Recientes
              {tipoUnidadPermitido === 'patrulla' && ' (Solo Patrullas)'}
              {tipoUnidadPermitido === 'ambulancia' && ' (Solo Ambulancias)'}
            </h2>
            {actividadReciente.unidades && actividadReciente.unidades.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {actividadReciente.unidades
                  .filter(u => !tipoUnidadPermitido || u.tipo === tipoUnidadPermitido)
                  .map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2 md:p-3 bg-slate-50 rounded-lg md:rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 ${u.tipo === 'patrulla' ? 'bg-blue-100' : 'bg-emerald-100'
                          }`}>
                          <IconoEntidad
                            entidad={u.tipo === 'patrulla' ? 'PATRULLA' : 'AMBULANCIA'}
                            size={16}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium text-slate-800 truncate">{u.codigo}</p>
                          <p className="text-xs text-slate-400 capitalize truncate">{u.tipo === 'patrulla' ? 'Patrulla' : 'Ambulancia'}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap ${u.estado === 'disponible' ? 'bg-emerald-100 text-emerald-700' :
                        u.estado === 'ocupada' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                        {u.estado}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-4">No hay datos recientes</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;