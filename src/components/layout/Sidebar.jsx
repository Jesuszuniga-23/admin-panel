import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCog,
  Bell,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Shield,
  LogOut,
  Truck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  XCircle,
  UserPlus,
  Key,
  Activity
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

// Función para formatear nombres (acentos y mayúsculas)
const formatearNombre = (nombre) => {
  if (!nombre) return '';
  
  // Mapa de caracteres mal codificados
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã�', para: 'Á' },
    { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã±', para: 'ñ' }, { de: 'Ã‘', para: 'Ñ' },
    { de: 'Â¿', para: '¿' }, { de: 'Â¡', para: '¡' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }, { de: '€', para: 'é' },
    { de: '‚', para: 'é' }, { de: '¢', para: 'ó' },
    { de: 'Ram¡rez', para: 'Ramírez' }, { de: 'Z£¤iga', para: 'Zúñiga' },
    { de: 'L¢pez', para: 'López' }, { de: 'Jes£s', para: 'Jesús' },
    { de: 'Param‚dico', para: 'Paramédico' }, { de: 'Oficial', para: 'Oficial' }
  ];
  
  let nombreFormateado = nombre;
  reemplazos.forEach(({ de, para }) => {
    nombreFormateado = nombreFormateado.split(de).join(para);
  });
  
  // Capitalizar primera letra de cada palabra
  return nombreFormateado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState({
    alertas: true,      // Abierto por defecto
    usuarios: false,
    unidades: false,
    reportes: false
  });

  const handleLogout = async () => {
    try {
      console.log("🚪 Cerrando sesión...");
      await authService.logout();
      logout();
      navigate('/');
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      toast.error('Error al cerrar sesión');
      window.location.href = '/';
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  if (!user) return null;

  // Formatear nombre del usuario
  const nombreFormateado = formatearNombre(user.nombre);

  return (
    <aside className="w-72 bg-white shadow-lg flex flex-col h-screen overflow-y-auto">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Sistema de Alertas</h2>
        <p className="text-xs text-gray-500 mt-1">
          Administración Sistema Central
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {/* ========== DASHBOARD ========== */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* ========== PERFIL ========== */}
        <NavLink
          to="/admin/perfil"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`
          }
        >
          <UserCog size={18} />
          <span>Perfil</span>
        </NavLink>

        {/* ========== ALERTAS (MENÚ PRINCIPAL) ========== */}
        <div className="border-t pt-2 mt-2">
          <button
            onClick={() => toggleMenu('alertas')}
            className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-gray-500" />
              <span className="font-medium">Alertas</span>
            </div>
            {openMenus.alertas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {openMenus.alertas && (
            <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-gray-100">
              {/* Todas las Alertas (próximamente) */}
              <button
                onClick={() => console.log("Todas las Alertas - en construcción")}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 cursor-not-allowed hover:bg-gray-50 rounded-lg transition-all"
                disabled
              >


              </button>

             

            
              {/* Alertas Activas (NUEVO) */}
              <NavLink
                to="/admin/alertas/activas"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <Bell size={16} />
                <span>Activas</span>
              </NavLink>

              {/* Alertas en Proceso (NUEVO) */}
              <NavLink
                to="/admin/alertas/en-proceso"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <Activity size={16} />
                <span>En Proceso</span>
              </NavLink>

              {/* Alertas Cerradas (NUEVO) */}
              <NavLink
                to="/admin/alertas/cerradas"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <CheckCircle size={16} />
                <span>Cerradas</span>
              </NavLink>
               {/* Alertas Expiradas */}
              <NavLink
                to="/admin/alertas/expiradas"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <Clock size={16} />
                <span>Expiradas</span>
              </NavLink>
               {/* Alertas Cerradas Manualmente */}
              <NavLink
                to="/admin/alertas/cerradas-manual"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <CheckCircle size={16} />
                <span>Cerradas Manualmente</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ========== REASIGNACIONES ========== */}
        <NavLink
          to="/admin/reasignaciones/pendientes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`
          }
        >
          <RefreshCw size={18} />
          <span>Reasignaciones</span>
        </NavLink>

        {/* ========== GESTIÓN DE USUARIOS (MENÚ PRINCIPAL) ========== */}
        <div className="border-t pt-2 mt-2">
          <button
            onClick={() => toggleMenu('usuarios')}
            className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-gray-500" />
              <span className="font-medium">Gestión de Usuarios</span>
            </div>
            {openMenus.usuarios ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {openMenus.usuarios && (
            <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-gray-100">
              {/* Personal */}
              <NavLink
                to="/admin/personal"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <UserPlus size={16} />
                <span>Personal</span>
              </NavLink>

              {/* Recuperaciones */}
              <NavLink
                to="/admin/recuperaciones/pendientes"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`
                }
              >
                <Key size={16} />
                <span>Recuperaciones</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ========== UNIDADES ========== */}
        <NavLink
          to="/admin/unidades"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`
          }
        >
          <Truck size={18} />
          <span>Unidades</span>
        </NavLink>

        {/* ========== ESTADÍSTICAS (próximamente) ========== */}
        <button
          onClick={() => console.log("Estadísticas - en construcción")}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 cursor-not-allowed hover:bg-gray-50 rounded-lg transition-all"
          disabled
        >

        </button>

        {/* ========== CENTRO DE REPORTES ========== */}
        <NavLink
          to="/admin/reportes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
              ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
            }`
          }
        >
          <FileText size={18} />
          <span>Centro de Reportes</span>
        </NavLink>
      </nav>

      {/* Información del usuario y Logout */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
            {nombreFormateado?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{nombreFormateado}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user.rol}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;