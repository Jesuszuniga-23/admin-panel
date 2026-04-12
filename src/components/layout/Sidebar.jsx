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
  Activity,
  Globe,
  HelpCircle,
  Shield,
  Building2,
  Crown,
  Menu,
  X
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

// Componente Modal de Confirmación
const ConfirmacionModal = ({ isOpen, onClose, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative z-[10000]">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              ¿Guardar progreso?
            </h3>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Tienes cambios sin guardar en el formulario. ¿Deseas guardar el progreso antes de salir?
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 sm:py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
              aria-label="Descartar cambios y salir"
            >
              No, descartar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md"
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

// Componente para item del menú
const MenuItem = ({ onClick, isActive, icon: Icon, children, variant = 'default' }) => {
  const variants = {
    default: 'text-gray-700 hover:bg-gray-50 hover:text-blue-600',
    active: 'bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-600',
    superadmin: 'text-gray-700 hover:bg-gray-50 hover:text-purple-600',
    superadminActive: 'bg-purple-50 text-purple-600 font-semibold border-l-4 border-purple-600'
  };

  const activeClass = variant === 'superadmin' 
    ? (isActive ? variants.superadminActive : variants.superadmin)
    : (isActive ? variants.active : variants.default);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base ${activeClass}`}
    >
      <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
      <span className="truncate text-left">{children}</span>
    </button>
  );
};

// Componente para submenú
const SubMenuItem = ({ onClick, isActive, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-semibold'
        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
    }`}
  >
    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
    <span className="truncate text-left">{children}</span>
  </button>
);

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Obtener rol del usuario
  const rol = user?.rol;
  const esSuperAdmin = rol === 'superadmin';
  const esAdmin = rol === 'admin' || rol === 'superadmin';
  const esOperadorTecnico = rol === 'operador_tecnico';
  const esOperadorPolicial = rol === 'operador_policial';
  const esOperadorMedico = rol === 'operador_medico';
  const esOperadorGeneral = rol === 'operador_general';

  // Definir permisos según rol
  const puedeVerPersonal = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico || esOperadorGeneral;
  const puedeVerUnidades = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeVerReasignaciones = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;
  const puedeVerAnalisis = esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico;

  // Cerrar sidebar en móvil al navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Escuchar eventos de cambios sin guardar
  useEffect(() => {
    const handleUnsavedStatus = (event) => {
      setHasUnsavedChanges(event.detail.hasUnsaved);
      setIsPersonalFormActive(event.detail.isPersonalFormActive || false);
    };
    window.addEventListener('formUnsavedStatus', handleUnsavedStatus);
    return () => window.removeEventListener('formUnsavedStatus', handleUnsavedStatus);
  }, []);

  // Resetear estado cuando se sale de la ruta del formulario
  useEffect(() => {
    if (!location.pathname.includes('/admin/personal')) {
      setHasUnsavedChanges(false);
      setIsPersonalFormActive(false);
    }
  }, [location.pathname]);

  const performLogout = useCallback(async () => {
    try {
      await authService.logout();
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
      console.error("Error al cerrar sesión:", error);
      toast.error('Error al cerrar sesión');
      window.location.href = '/';
    }
  }, [logout, navigate]);

  const handleNavigation = useCallback((path) => {
    if (path.startsWith('/superadmin')) {
      setHasUnsavedChanges(false);
      setIsPersonalFormActive(false);
      navigate(path);
      return;
    }

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

  // Contenido del sidebar
  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Sistema de Alertas</h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              Administración Sistema Central
            </p>
          </div>
          {/* Botón cerrar en móvil */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {!esAdmin && (
          <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Rol: {rolFormateado}</span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {/* ===================================================== */}
        {/* PANEL DE ADMINISTRACIÓN - Solo visible para NO superadmin */}
        {/* ===================================================== */}
        {!esSuperAdmin && (
          <>
            {/* DASHBOARD */}
            <MenuItem
              onClick={() => handleNavigation("/admin/dashboard")}
              isActive={location.pathname === "/admin/dashboard"}
              icon={LayoutDashboard}
            >
              Dashboard
            </MenuItem>

            {/* PERFIL */}
            <MenuItem
              onClick={() => handleNavigation("/admin/perfil")}
              isActive={location.pathname === "/admin/perfil"}
              icon={UserCog}
            >
              Perfil
            </MenuItem>

            {/* ALERTAS */}
            {(esAdmin || esOperadorTecnico || esOperadorPolicial || esOperadorMedico) && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={() => toggleMenu('alertas')}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                  aria-label="Abrir menú de alertas"
                  aria-expanded={openMenus.alertas}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-500" />
                    <span className="font-medium text-sm sm:text-base">Alertas</span>
                  </div>
                  {openMenus.alertas ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {openMenus.alertas && (
                  <div className="ml-3 sm:ml-4 mt-1 space-y-1 pl-3 sm:pl-4 border-l-2 border-gray-100">
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/alertas/activas")}
                      isActive={location.pathname === "/admin/alertas/activas"}
                      icon={Bell}
                    >
                      Activas
                    </SubMenuItem>
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/alertas/en-proceso")}
                      isActive={location.pathname === "/admin/alertas/en-proceso"}
                      icon={Activity}
                    >
                      En Proceso
                    </SubMenuItem>
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/alertas/cerradas")}
                      isActive={location.pathname === "/admin/alertas/cerradas"}
                      icon={CheckCircle}
                    >
                      Cerradas
                    </SubMenuItem>
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/alertas/expiradas")}
                      isActive={location.pathname === "/admin/alertas/expiradas"}
                      icon={Clock}
                    >
                      Expiradas
                    </SubMenuItem>
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/alertas/cerradas-manual")}
                      isActive={location.pathname === "/admin/alertas/cerradas-manual"}
                      icon={CheckCircle}
                    >
                      Cerradas Manualmente
                    </SubMenuItem>
                  </div>
                )}
              </div>
            )}

            {/* REASIGNACIONES */}
            {puedeVerReasignaciones && (
              <MenuItem
                onClick={() => handleNavigation("/admin/reasignaciones/pendientes")}
                isActive={location.pathname === "/admin/reasignaciones/pendientes"}
                icon={RefreshCw}
              >
                Reasignaciones
              </MenuItem>
            )}

            {/* GESTIÓN DE USUARIOS */}
            {puedeVerPersonal && (
              <div className="border-t pt-2 mt-2">
                <button
                  onClick={() => toggleMenu('usuarios')}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                  aria-label="Abrir menú de gestión de usuarios"
                  aria-expanded={openMenus.usuarios}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-gray-500" />
                    <span className="font-medium text-sm sm:text-base">Gestión de Usuarios</span>
                  </div>
                  {openMenus.usuarios ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {openMenus.usuarios && (
                  <div className="ml-3 sm:ml-4 mt-1 space-y-1 pl-3 sm:pl-4 border-l-2 border-gray-100">
                    <SubMenuItem
                      onClick={() => handleNavigation("/admin/personal")}
                      isActive={location.pathname === "/admin/personal"}
                      icon={UserPlus}
                    >
                      Personal
                    </SubMenuItem>
                  </div>
                )}
              </div>
            )}

            {/* UNIDADES */}
            {puedeVerUnidades && (
              <MenuItem
                onClick={() => handleNavigation("/admin/unidades")}
                isActive={location.pathname === "/admin/unidades"}
                icon={Truck}
              >
                Unidades
              </MenuItem>
            )}

            {/* CENTRO DE REPORTES */}
            <MenuItem
              onClick={() => handleNavigation("/admin/reportes")}
              isActive={location.pathname === "/admin/reportes"}
              icon={FileText}
            >
              Centro de Reportes
            </MenuItem>

            {/* ANÁLISIS GEOGRÁFICO */}
            {puedeVerAnalisis && (
              <MenuItem
                onClick={() => handleNavigation("/admin/analisis/geografico")}
                isActive={location.pathname === "/admin/analisis/geografico"}
                icon={Globe}
              >
                Análisis Geográfico
              </MenuItem>
            )}
          </>
        )}

        {/* ===================================================== */}
        {/* PANEL DE SUPERADMIN - Solo para superadmin */}
        {/* ===================================================== */}
        {esSuperAdmin && (
          <div className="border-t pt-2 mt-2">
            <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Super Admin
            </div>

            <MenuItem
              onClick={() => handleNavigation("/superadmin/dashboard")}
              isActive={location.pathname === "/superadmin/dashboard"}
              icon={LayoutDashboard}
              variant="superadmin"
            >
              Dashboard Control
            </MenuItem>

            <MenuItem
              onClick={() => handleNavigation("/superadmin/municipios")}
              isActive={location.pathname.startsWith("/superadmin/municipios")}
              icon={Building2}
              variant="superadmin"
            >
              Municipios
            </MenuItem>

            <MenuItem
              onClick={() => handleNavigation("/superadmin/superadmins")}
              isActive={location.pathname.startsWith("/superadmin/superadmins")}
              icon={Shield}
              variant="superadmin"
            >
              Super Admins
            </MenuItem>

            <MenuItem
              onClick={() => handleNavigation("/superadmin/admins-municipales")}
              isActive={location.pathname === "/superadmin/admins-municipales"}
              icon={Crown}
              variant="superadmin"
            >
              Admins Municipales
            </MenuItem>
          </div>
        )}
      </nav>

      {/* Información del usuario y Logout */}
      <div className="border-t p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
            {nombreFormateado?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{nombreFormateado}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate capitalize">{rolFormateado}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm sm:text-base"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botón Hamburguesa - Solo visible en móvil/tablet */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: siempre visible, Móvil: deslizable */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-[80] transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 sm:w-72 lg:w-72 bg-white shadow-lg flex flex-col overflow-y-auto`}
      >
        {sidebarContent}
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