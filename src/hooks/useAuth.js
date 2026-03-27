// src/hooks/useAuth.js
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import authService from '../services/auth.service';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, setUser, setLoading } = useAuthStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const abortControllerRef = useRef(null);

  // ✅ Cancelar peticiones al desmontar
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      console.log("✅ Respuesta completa de Google:", response);
      
      // ✅ El token viene en response.credential
      const token = response.credential;
      
      if (!token) {
        console.error("❌ No se encontró credential en la respuesta:", response);
        toast.error('Error: No se pudo obtener el token de Google');
        setIsLoggingIn(false);
        return;
      }

      // ✅ Cancelar petición anterior si existe
      cleanup();
      
      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();
      
      setIsLoggingIn(true);
      setLoginError(null);
      setLoading(true);

      try {
        toast.loading('Verificando credenciales...', { id: 'login' });
        
        const result = await authService.loginWithGoogle(token, {
          signal: abortControllerRef.current.signal
        });
        
        toast.dismiss('login');
        console.log("📦 Resultado del login:", result);
        
        if (result?.success) {
          setUser(result.usuario);
          toast.success(`Bienvenido ${result.usuario?.nombre || result.usuario?.email || 'Usuario'}`);
          
          // ✅ Manejo correcto de roles
          const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
          
          if (rolesAdmin.includes(result.usuario?.rol)) {
            navigate('/admin/dashboard', { replace: true });
          } else if (result.usuario?.rol === 'ciudadano') {
            navigate('/mobile', { replace: true });
          } else {
            console.warn(`⚠️ Rol no reconocido: ${result.usuario?.rol}`);
            navigate('/login', { replace: true });
          }
        } else {
          const errorMsg = result?.error || 'Error al iniciar sesión';
          setLoginError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        toast.dismiss('login');
        
        // ✅ Manejar cancelación
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          console.log('🛑 Login cancelado');
          return;
        }
        
        console.error("❌ Error en proceso de login:", error);
        
        // ✅ Manejar caso de 2FA requerido
        if (error?.requires_2fa) {
          navigate(`/verificar-2fa?email=${encodeURIComponent(error.email_ofuscado)}`);
        } else {
          const errorMsg = error?.error || error?.message || 'Error al conectar con el servidor';
          setLoginError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        setIsLoggingIn(false);
        setLoading(false);
        cleanup();
      }
    },
    onError: (error) => {
      console.error("❌ Error de Google OAuth:", error);
      const errorMsg = error?.error_description || error?.error || 'Error en autenticación con Google';
      setLoginError(errorMsg);
      toast.error(errorMsg);
      setIsLoggingIn(false);
      setLoading(false);
    },
    flow: 'implicit',
    scope: 'openid email profile',
  });

  // ✅ Logout con AbortController
  const logout = useCallback(async () => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      await authService.logout({
        signal: abortControllerRef.current.signal
      });
    } catch (error) {
      // ✅ Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("❌ Error al cerrar sesión:", error);
      }
    } finally {
      cleanup();
    }
  }, []);

  // ✅ Función para verificar sesión actual
  const checkSession = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const isActive = await authService.checkSession({
        signal: abortControllerRef.current.signal
      });
      return isActive;
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error checking session:', error);
      }
      return false;
    } finally {
      cleanup();
    }
  }, []);

  // ✅ Limpiar al desmontar
  const cleanupRef = useRef(cleanup);
  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);

  return {
    user,
    login,
    logout,
    checkSession,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isSuperAdmin: authService.isSuperAdmin(),
    isLoggingIn,
    loginError,
    resetLoginError: () => setLoginError(null)
  };
};