import { Shield, LogIn, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { useEffect, useState, useRef } from 'react';
import { obtenerTenantActual } from '../../utils/storage';

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTenant, setCurrentTenant] = useState('default');
  
  const redirectTimeoutRef = useRef(null);

  useEffect(() => {
    const tenant = obtenerTenantActual();
    setCurrentTenant(tenant);
  }, []);

  useEffect(() => {
    if (user) {
      const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
      
      if (rolesAdmin.includes(user.rol)) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.rol === 'ciudadano') {
        navigate('/mobile', { replace: true });
      }
    }
  }, [user, navigate]);
  
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleLoginClick = () => {
    setIsLoading(true);
    
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      toast.error('Error de configuración: URL de API no definida');
      setIsLoading(false);
      return;
    }
    
    const tenantId = obtenerTenantActual();
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const loginUrl = `${baseUrl}/auth/login/google?tenant=${tenantId}`;
    
    redirectTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      toast.error('La redirección está tomando más tiempo de lo esperado. Intenta nuevamente.');
    }, 10000);
    
    try {
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error en redirección:', error);
      setIsLoading(false);
      toast.error('Error al redirigir. Intenta nuevamente.');
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header - SOLO UN ÍCONO */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Acceso Administrativo</h1>
            <p className="text-blue-100 text-xs">Sistema de Emergencias SOFTNOVA</p>
          </div>

          <div className="p-6">
            <div className="mb-4 text-center">
              <p className="text-gray-600 text-sm">Inicia sesión con tu cuenta corporativa</p>
              <p className="text-xs text-gray-400 mt-0.5">Solo personal autorizado</p>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-r-xl p-3 mb-4">
              <p className="text-xs text-amber-800"> Acceso exclusivo para personal autorizado</p>
            </div>

            {isLoading && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-[#1E3A5F]">Redirigiendo a Google...</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLoginClick}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] hover:from-[#2A4E7A] hover:to-[#1E3A5F] text-white px-6 py-3 rounded-xl font-medium text-sm transition duration-300 shadow-lg shadow-[#1E3A5F]/20 disabled:opacity-50 w-full"
            >
              <LogIn size={18} />
              <span>Iniciar sesión con Google</span>
            </button>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all group"
              >
                <ArrowLeft size={16} className="text-gray-400 group-hover:text-[#1E3A5F] group-hover:-translate-x-1 transition-all" />
                <span className="text-xs font-medium text-gray-600 group-hover:text-[#1E3A5F]">Regresar al inicio</span>
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">© 2026 SOFTNOVA - Protección Civil</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;