// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect, useState, useCallback } from 'react';
import authService from '../services/auth.service';

const PrivateRoute = ({ children, allowedRoles = ['admin', 'superadmin'] }) => {
  const { user, isLoading, setUser } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ✅ Logs solo en desarrollo
  const log = useCallback((...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  }, []);

  // ✅ Verificar sesión activa con el backend
  const verificarSesion = useCallback(async () => {
    try {
      log('🔒 PrivateRoute - Verificando sesión...');
      const estado = await authService.obtenerEstadoSesion();
      
      if (!estado.activa) {
        log('❌ PrivateRoute - Sesión inactiva');
        setIsAuthorized(false);
        setUser(null);
        return false;
      }
      
      // ✅ Si hay usuario en store pero la sesión está activa, mantenerlo
      if (user && estado.activa) {
        log('✅ PrivateRoute - Sesión activa, usuario:', user.email);
        setIsAuthorized(allowedRoles.includes(user.rol));
        return true;
      }
      
      return false;
    } catch (error) {
      log('❌ PrivateRoute - Error verificando sesión:', error);
      setIsAuthorized(false);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [user, allowedRoles, setUser, log]);

  useEffect(() => {
    // ✅ Si ya hay usuario en store y no está cargando, verificar rápidamente
    if (user && !isLoading) {
      log('🔒 PrivateRoute - Usuario en store, verificando permisos...');
      log('🔒 PrivateRoute - user rol:', user.rol);
      log('🔒 PrivateRoute - allowedRoles:', allowedRoles);
      
      const tienePermiso = allowedRoles.includes(user.rol);
      setIsAuthorized(tienePermiso);
      setIsVerifying(false);
      
      if (!tienePermiso) {
        log('❌ PrivateRoute - Rol no autorizado:', user.rol);
      } else {
        log('✅ PrivateRoute - Acceso permitido para:', user.rol);
      }
      return;
    }
    
    // ✅ Si no hay usuario, verificar sesión con el backend
    if (!user && !isLoading) {
      verificarSesion();
    }
  }, [user, isLoading, allowedRoles, verificarSesion, log]);

  // ✅ Mostrar loading mientras se verifica
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // ✅ Redirigir si no hay usuario autorizado
  if (!user || !isAuthorized) {
    log('❌ PrivateRoute - Redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;