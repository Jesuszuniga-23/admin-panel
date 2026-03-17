import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, UserCircle, Settings, LogOut
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
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
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
  ];
  
  let nombreNormalizado = nombre;
  reemplazos.forEach(({ de, para }) => {
    nombreNormalizado = nombreNormalizado.split(de).join(para);
  });
  
  // Capitalizar primera letra de cada palabra
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const Header = ({ titulo = 'Panel de Administración', subtitulo = 'Gestión del sistema' }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  // Formatear nombre del usuario
  const nombreFormateado = user?.nombre ? formatearNombre(user.nombre) : '';
  const emailFormateado = user?.email || '';
  const rolFormateado = user?.rol || '';

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 md:p-2 rounded-xl shadow-lg shadow-blue-200 flex-shrink-0">
              <LayoutDashboard size={20} className="md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 truncate">{titulo}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{subtitulo}</p>
            </div>
          </div>

          {/* Iconos y menú de usuario */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="p-1.5 md:p-2 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={18} className="md:w-5 md:h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full"></span>
            </button>

            {/* User Menu - RESPONSIVE */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 md:gap-3 hover:bg-slate-100 p-1.5 md:p-2 rounded-xl transition-all"
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
              
              {/* Menú desplegable - RESPONSIVE */}
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
                    >
                      <UserCircle size={16} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">Mi Perfil</span>
                    </button>
                    <button
                      onClick={() => {
                        // Configuración - por implementar
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings size={16} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">Configuración</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
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

      {/* Estilo para animación */}
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
  );
};

export default Header;