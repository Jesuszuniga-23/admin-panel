// src/components/layout/Sidebar.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCog,
  Bell,
  Users,
  FileText,
  CheckCircle,
  LogOut,
  Truck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  UserPlus,
  Key,
  Activity,
  Globe,
  HelpCircle,
  Shield,
  Building2,
  CreditCard,
  Crown,
  Star
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

// Texto legible para roles
const rolTexto = {
  admin: 'Administrador',
  superadmin: 'Super Administrador',
  policia: 'Policía',
  ambulancia: 'Ambulancia',
  operador_tecnico: 'Operador Técnico',
  operador_policial: 'Operador Policial',
  operador_medico: 'Operador Médico',
  operador_general: 'Operador General'
};

// Componente Modal de Confirmación con z-index más alto
const ConfirmacionModal = ({ isOpen, onClose, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-[10000]">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <HelpCircle size={24} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              ¿Guardar progreso?
            </h3>
          </div>

          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar en el formulario. ¿Deseas guardar el progreso antes de salir?
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
              aria-label="Descartar cambios y salir"
            >
              No, descartar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md"
              aria-label="Guardar progreso y salir"
            >
              Sí, guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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

  let nombreFormateado = nombre;
  reemplazos.forEach(({ de, para }) => {
    nombreFormateado = nombreFormateado.split(de).join(para);
  });

  return nombreFormateado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState({
    alertas: true,
    usuarios: false
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPersonalFormActive, setIsPersonalFormActive] = useState(false);

  // Obtener rol del usuario
  const rol = user?.rol;
  const esSuperAdmin = rol === 'superadmin';  // ← CLAVE: identificar superadmin
  const esAdmin = rol === 'admin' || rol === 'superadmin';
  const esOperadorTecnico = rol === 'operador_tecnico';
  const esOperadorPolicial = rol === 'operador_policial';
  const esOperadorMedico = rol === 'operador_medico';
  const esOperadorGeneral = rol === 'operador_general';

  // Definir permisos según rol (para admin normal)
  const puedeVerPersonal = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico || esOperadorGeneral;
  const puedeGestionarPersonal = esAdmin || esOperadorPolicial || esOperadorMedico;
  const puedeVerUnidades = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeGestionarUnidades = esAdmin || esOperadorTecnico;
  const puedeVerReasignaciones = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeGestionarReasignaciones = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeVerReportes = true;
  const puedeVerAnalisis = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeVerRecuperaciones = esAdmin || esOperadorTecnico;

  // Escuchar eventos de cambios sin guardar
  useEffect(() => {
    const handleUnsavedStatus = (event) => {
      setHasUnsavedChanges(event.detail.hasUnsaved);
      setIsPersonalFormActive(event.detail.isPersonalFormActive || false);
    };

    window.addEventListener('formUnsavedStatus', handleUnsavedStatus);

    return () => {
      window.removeEventListener('formUnsavedStatus', handleUnsavedStatus);
    };
  }, []);

  // Resetear estado cuando se sale de la ruta del formulario
  useEffect(() => {
    if (!location.pathname.includes('/admin/personal')) {
      setHasUnsavedChanges(false);
      setIsPersonalFormActive(false);
    }
  }, [location.pathname]);

  // Memoizar funciones
  const performLogout = useCallback(async () => {
    try {
      console.log("Cerrando sesión...");
      await authService.logout();
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(' Logout cancelado');
        return;
      }
      console.error("Error al cerrar sesión:", error);
      toast.error('Error al cerrar sesión');
      window.location.href = '/';
    }
  }, [logout, navigate]);

  const handleNavigation = useCallback((path) => {
    //  SIEMPRE navegar en rutas de superadmin (sin confirmación)
    if (path.startsWith('/superadmin')) {
      setHasUnsavedChanges(false);
      setIsPersonalFormActive(false);
      navigate(path);
      return;
    }

    // Para otras rutas, mantener la lógica original
    if (hasUnsavedChanges && isPersonalFormActive && path !== location.pathname) {
      setPendingPath(path);
      setShowConfirmModal(true);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, isPersonalFormActive, location.pathname, navigate]);

  const handleLogout = useCallback(() => {
    if (hasUnsavedChanges && isPersonalFormActive) {
      setPendingPath('logout');
      setShowConfirmModal(true);
    } else {
      performLogout();
    }
  }, [hasUnsavedChanges, isPersonalFormActive, performLogout]);

  const handleConfirmSave = useCallback(() => {
    setShowConfirmModal(false);

    const saveEvent = new CustomEvent('saveFormProgress');
    window.dispatchEvent(saveEvent);

    setTimeout(() => {
      if (pendingPath === 'logout') {
        performLogout();
      } else if (pendingPath) {
        navigate(pendingPath);
      }
      setPendingPath(null);
    }, 100);
  }, [pendingPath, performLogout, navigate]);

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmModal(false);

    const discardEvent = new CustomEvent('discardFormProgress');
    window.dispatchEvent(discardEvent);

    setHasUnsavedChanges(false);
    setIsPersonalFormActive(false);

    if (pendingPath === 'logout') {
      performLogout();
    } else if (pendingPath) {
      navigate(pendingPath);
    }
    setPendingPath(null);
  }, [pendingPath, performLogout, navigate]);

  const handleCancel = useCallback(() => {
    setShowConfirmModal(false);
    setPendingPath(null);
  }, []);

  const toggleMenu = useCallback((menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  }, []);

  if (!user) return null;

  const nombreFormateado = formatearNombre(user.nombre);
  const rolFormateado = rolTexto[rol] || rol;

  return (
    <>
      <aside className="w-72 bg-white shadow-lg flex flex-col h-screen overflow-y-auto relative z-10">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Sistema de Alertas</h2>
          <p className="text-xs text-gray-500 mt-1">
            Administración Sistema Central
          </p>
          {!esAdmin && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <Shield size={12} />
              <span>Rol: {rolFormateado}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* ===================================================== */}
          {/* PANEL DE ADMINISTRACIÓN - Solo visible para NO superadmin */}
          {/* ===================================================== */}
          {!esSuperAdmin && (
            <>
              {/* DASHBOARD */}
              <button
                onClick={() => handleNavigation("/admin/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/dashboard"
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                aria-label="Ir al dashboard"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              {/* PERFIL */}
              <button
                onClick={() => handleNavigation("/admin/perfil")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/perfil"
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                aria-label="Ver mi perfil"
              >
                <UserCog size={18} />
                <span>Perfil</span>
              </button>

              {/* ALERTAS */}
              {(esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico) && (
                <div className="border-t pt-2 mt-2">
                  <button
                    onClick={() => toggleMenu('alertas')}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                    aria-label="Abrir menú de alertas"
                    aria-expanded={openMenus.alertas}
                  >
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-gray-500" />
                      <span className="font-medium">Alertas</span>
                    </div>
                    {openMenus.alertas ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {openMenus.alertas && (
                    <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-gray-100">
                      <button
                        onClick={() => handleNavigation("/admin/alertas/activas")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/alertas/activas"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        <Bell size={16} />
                        <span>Activas</span>
                      </button>

                      <button
                        onClick={() => handleNavigation("/admin/alertas/en-proceso")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/alertas/en-proceso"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        <Activity size={16} />
                        <span>En Proceso</span>
                      </button>

                      <button
                        onClick={() => handleNavigation("/admin/alertas/cerradas")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/alertas/cerradas"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        <CheckCircle size={16} />
                        <span>Cerradas</span>
                      </button>

                      <button
                        onClick={() => handleNavigation("/admin/alertas/expiradas")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/alertas/expiradas"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        <Clock size={16} />
                        <span>Expiradas</span>
                      </button>

                      <button
                        onClick={() => handleNavigation("/admin/alertas/cerradas-manual")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/alertas/cerradas-manual"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                      >
                        <CheckCircle size={16} />
                        <span>Cerradas Manualmente</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* REASIGNACIONES */}
              {puedeVerReasignaciones && (
                <button
                  onClick={() => handleNavigation("/admin/reasignaciones/pendientes")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/reasignaciones/pendientes"
                    ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  aria-label="Ver reasignaciones pendientes"
                >
                  <RefreshCw size={18} />
                  <span>Reasignaciones</span>
                </button>
              )}

              {/* GESTIÓN DE USUARIOS */}
              {puedeVerPersonal && (
                <div className="border-t pt-2 mt-2">
                  <button
                    onClick={() => toggleMenu('usuarios')}
                    className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                    aria-label="Abrir menú de gestión de usuarios"
                    aria-expanded={openMenus.usuarios}
                  >
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-gray-500" />
                      <span className="font-medium">Gestión de Usuarios</span>
                    </div>
                    {openMenus.usuarios ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  {openMenus.usuarios && (
                    <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-gray-100">
                      <button
                        onClick={() => handleNavigation("/admin/personal")}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all ${location.pathname === "/admin/personal"
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                          }`}
                        aria-label="Ver personal"
                      >
                        <UserPlus size={16} />
                        <span>Personal</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* UNIDADES */}
              {puedeVerUnidades && (
                <button
                  onClick={() => handleNavigation("/admin/unidades")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/unidades"
                    ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  aria-label="Ver unidades"
                >
                  <Truck size={18} />
                  <span>Unidades</span>
                </button>
              )}

              {/* CENTRO DE REPORTES */}
              <button
                onClick={() => handleNavigation("/admin/reportes")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/reportes"
                  ? 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                aria-label="Ir al centro de reportes"
              >
                <FileText size={18} />
                <span>Centro de Reportes</span>
              </button>

              {/* ANÁLISIS GEOGRÁFICO */}
              {puedeVerAnalisis && (
                <button
                  onClick={() => handleNavigation("/admin/analisis/geografico")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/admin/analisis/geografico"
                    ? 'bg-indigo-50 text-indigo-600 font-semibold border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                  aria-label="Ver análisis geográfico"
                >
                  <Globe size={18} />
                  <span>Análisis Geográfico</span>
                </button>
              )}
            </>
          )}

          {/* ===================================================== */}
          {/* PANEL DE SUPERADMIN - Solo para superadmin */}
          {/* ===================================================== */}
          {esSuperAdmin && (
            <div className="border-t pt-2 mt-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Super Admin
              </div>

              {/* Dashboard de Control */}
              <button onClick={() => handleNavigation("/superadmin/dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/superadmin/dashboard"
                  ? 'bg-purple-50 text-purple-600 font-semibold border-l-4 border-purple-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard Control</span>
              </button>

              {/* Municipios */}
              <button onClick={() => handleNavigation("/superadmin/municipios")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname.startsWith("/superadmin/municipios")
                  ? 'bg-purple-50 text-purple-600 font-semibold border-l-4 border-purple-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'}`}>
                <Building2 size={18} />
                <span>Municipios</span>
              </button>

              {/*  Super Administradores */}
              <button onClick={() => handleNavigation("/superadmin/superadmins")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname.startsWith("/superadmin/superadmins")
                  ? 'bg-purple-50 text-purple-600 font-semibold border-l-4 border-purple-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'}`}>
                <Shield size={18} />
                <span>Super Admins</span>
              </button>

              {/* Administradores Municipales */}
              <button onClick={() => handleNavigation("/superadmin/admins-municipales")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${location.pathname === "/superadmin/admins-municipales"
                  ? 'bg-purple-50 text-purple-600 font-semibold border-l-4 border-purple-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-purple-600'}`}>
                <Crown size={18} />
                <span>Admins Municipales</span>
              </button>
            </div>
          )}
        </nav>

        {/* Información del usuario y Logout */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold">
              {nombreFormateado?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{nombreFormateado}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{rolFormateado}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Modal de Confirmación */}
      <ConfirmacionModal
        isOpen={showConfirmModal}
        onClose={handleCancel}
        onConfirm={handleConfirmSave}
        onCancel={handleConfirmDiscard}
      />
    </>
  );
};

export default Sidebar;