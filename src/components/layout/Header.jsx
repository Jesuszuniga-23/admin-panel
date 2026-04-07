// src/components/layout/Header.jsx (MODIFICADO - AGREGAR TENANT SELECTOR)
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle, LogOut
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import TenantSelector from '../common/TenantSelector';  // ✅ NUEVO

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
              <LogOut size={24} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              ¿Cerrar sesión?
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Tienes cambios sin guardar en el formulario. Si cierras sesión, los cambios no guardados se perderán.
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
              aria-label="Cancelar cierre de sesión"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all text-sm font-medium shadow-md"
              aria-label="Confirmar cierre de sesión"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ titulo = 'Panel de Administración', subtitulo = 'Gestión del sistema' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPersonalFormActive, setIsPersonalFormActive] = useState(false);
  const menuRef = useRef(null);
  const logoutTimeoutRef = useRef(null);

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

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  const handleLogoutClick = () => {
    if (hasUnsavedChanges && isPersonalFormActive) {
      setShowConfirmModal(true);
      setUserMenuOpen(false);
    } else {
      performLogout();
    }
  };

  const performLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Logout cancelado');
        return;
      }
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const handleConfirmLogout = () => {
    setShowConfirmModal(false);
    const discardEvent = new CustomEvent('discardFormProgress');
    window.dispatchEvent(discardEvent);
    
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
    }
    
    logoutTimeoutRef.current = setTimeout(() => {
      performLogout();
    }, 100);
  };

  const handleCancelLogout = () => {
    setShowConfirmModal(false);
  };

  const nombreFormateado = user?.nombre ? formatearNombre(user.nombre) : '';
  const emailFormateado = user?.email || '';
  const rolFormateado = rolTexto[user?.rol] || user?.rol || '';

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-blue-200 flex-shrink-0">
                <LayoutDashboard size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 truncate">{titulo}</h1>
                <p className="text-xs text-slate-500 hidden sm:block">{subtitulo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* ✅ TENANT SELECTOR - Solo visible para superadmin */}
              <TenantSelector />
              
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 md:gap-3 hover:bg-slate-100 p-1.5 md:p-2 rounded-xl transition-all"
                  aria-label="Menú de usuario"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                    <span className="text-white text-base md:text-lg font-semibold">
                      {nombreFormateado?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs md:text-sm font-semibold text-slate-800 truncate max-w-[120px] md:max-w-[150px]">
                      {nombreFormateado || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[120px] md:max-w-[150px]">
                      {rolFormateado}
                    </p>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">{nombreFormateado || 'Usuario'}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{emailFormateado}</p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/admin/perfil');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        aria-label="Ir a mi perfil"
                      >
                        <UserCircle size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">Mi Perfil</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        aria-label="Cerrar sesión"
                      >
                        <LogOut size={16} className="flex-shrink-0" />
                        <span className="truncate">Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
      </header>

      <ConfirmacionModal
        isOpen={showConfirmModal}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
};

export default Header;