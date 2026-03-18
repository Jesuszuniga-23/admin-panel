import { GoogleLogin } from '@react-oauth/google';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import authService from '../../services/auth.service';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // SOLO redirigir si hay usuario autorizado
  useEffect(() => {
    if (user) {
      if (user.rol === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (user.rol === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log("Google Success:", credentialResponse);

    try {
      setIsLoading(true);
      toast.loading('Verificando credenciales...', { id: 'login' });

      const result = await authService.loginWithGoogle(credentialResponse.credential);

      toast.dismiss('login');
      console.log("Login exitoso:", result);

      if (result?.success) {
        // Verificar si el usuario tiene rol admin o superadmin
        if (result.usuario?.rol === 'admin' || result.usuario?.rol === 'superadmin') {
          // Usuario autorizado
          setUser(result.usuario);
          toast.success(`Bienvenido ${result.usuario?.nombre || result.usuario?.email}`);
          // El useEffect redirige
        } else {
          // Usuario NO autorizado
          console.log("Usuario no autorizado - rol:", result.usuario?.rol);

          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth-storage');

          window.location.href = '/?error=unauthorized&message=' +
            encodeURIComponent('Acceso restringido: Solo personal administrativo autorizado');
        }
      }
    } catch (error) {
      toast.dismiss('login');
      console.error(" Error:", error);

      if (error.response?.status === 403 || error.error === 'Usuario no autorizado') {
        console.log(" Usuario no autorizado (error 403)");

        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth-storage');

        window.location.href = '/?error=unauthorized&message=' +
          encodeURIComponent('Acceso restringido: Solo personal administrativo autorizado');
      } else {
        toast.error(error?.error || 'Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setIsLoading(false);
    toast.error('Error en autenticación con Google');
  };

  const handleCancel = () => {
    setIsLoading(false);
    setErrorMessage('Proceso cancelado por el usuario');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
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
          </div>

          {/* Contenido principal */}
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
                Acceso exclusivo para administradores y superadministradores
              </p>
            </div>

            {/* Indicador de carga */}
            {isLoading && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700">Procesando autenticación...</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Por favor, completa el proceso en la ventana de Google
                </p>
                <button
                  onClick={handleCancel}
                  className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Cancelar proceso
                </button>
              </div>
            )}

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                shape="pill"
                text="signin_with"
                size="large"
                width="280"
                useOneTap={false}
              />
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