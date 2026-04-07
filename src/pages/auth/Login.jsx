// src/pages/auth/Login.jsx (MODIFICADO - AGREGAR SOPORTE PARA TENANT)
import { Shield, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { obtenerTenantActual } from '../../utils/storage';  // ✅ NUEVO

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentTenant, setCurrentTenant] = useState('default');  // ✅ NUEVO
  
  const redirectTimeoutRef = useRef(null);

  // ✅ NUEVO: Cargar tenant actual al montar el componente
  useEffect(() => {
    const tenant = obtenerTenantActual();
    setCurrentTenant(tenant);
    console.log(`🏢 Login - Tenant actual: ${tenant}`);
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
    
    // ✅ Obtener tenant actual para pasarlo en la URL
    const tenantId = obtenerTenantActual();
    console.log(`🏢 Redirigiendo con tenant: ${tenantId}`);
    
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // ✅ Agregar tenant como query parameter para que el backend lo use
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <Shield size={48} className="text-white/90" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Acceso Administrativo
            </h1>
            <p className="text-blue-100 text-sm">
              Sistema de Emergencias
            </p>
            {/* ✅ NUEVO: Mostrar tenant actual */}
            <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs text-white">
              🏢 {currentTenant === 'default' ? 'Sistema Principal' : currentTenant}
            </div>
          </div>

          <div className="p-8">
            <div className="mb-6 text-center">
              <p className="text-gray-600 text-sm">
                Inicia sesión con tu cuenta corporativa
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Solo personal autorizado
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-700">
                Acceso exclusivo para personal autorizado
              </p>
            </div>

            {isLoading && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700">Redirigiendo a Google...</span>
                </div>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <button
                onClick={handleLoginClick}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition duration-300 shadow-md hover:shadow-lg disabled:opacity-50 w-full"
              >
                <LogIn size={20} />
                <span>Iniciar sesión con Google</span>
              </button>
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all group"
              >
                <ArrowLeft size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Regresar al inicio</span>
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-gray-500">
              © 2026 Sistema de Emergencias
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;