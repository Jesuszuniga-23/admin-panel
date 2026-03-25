// src/hooks/useAuth.js
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import authService from '../services/auth.service';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      console.log("Respuesta completa de Google:", response);
      
      // ✅ El token viene en response.credential
      const token = response.credential;
      
      if (!token) {
        console.error("No se encontró credential en la respuesta:", response);
        toast.error('Error: No se pudo obtener el token de Google');
        return;
      }

      try {
        toast.loading('Verificando credenciales...', { id: 'login' });
        
        const result = await authService.loginWithGoogle(token);
        
        toast.dismiss('login');
        console.log("Resultado del login:", result);
        
        if (result?.success) {
          setUser(result.usuario);
          toast.success(`Bienvenido ${result.usuario?.nombre || result.usuario?.email || 'Usuario'}`);
          
          // ✅ Manejo correcto de roles
          const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
          
          if (rolesAdmin.includes(result.usuario?.rol)) {
            navigate('/admin/dashboard');
          } else if (result.usuario?.rol === 'ciudadano') {
            navigate('/mobile');
          } else {
            navigate('/login');
          }
        } else {
          toast.error(result?.error || 'Error al iniciar sesión');
        }
      } catch (error) {
        toast.dismiss('login');
        console.error("Error en proceso de login:", error);
        
        // ✅ Manejar caso de 2FA requerido
        if (error?.requires_2fa) {
          navigate(`/verificar-2fa?email=${encodeURIComponent(error.email_ofuscado)}`);
        } else {
          toast.error(error?.error || 'Error al conectar con el servidor');
        }
      }
    },
    onError: (error) => {
      console.error("Error de Google OAuth:", error);
      toast.error('Error en autenticación con Google');
    },
    flow: 'implicit',
    scope: 'openid email profile',
  });

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return {
    user,
    login,
    logout,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isSuperAdmin: authService.isSuperAdmin()
  };
};