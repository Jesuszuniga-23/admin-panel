// src/routes/PrivateRoute.jsx (MODIFICADO - AGREGAR VALIDACIÓN DE TENANT)
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect, useState, useCallback } from 'react';
import authService from '../services/auth.service';
import { obtenerTenantActual } from '../utils/storage';  // ✅ NUEVO

const PrivateRoute = ({ children, allowedRoles = ['admin', 'superadmin'] }) => {
  const { user, isLoading, setUser } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tenantValid, setTenantValid] = useState(true);  // ✅ NUEVO

  const log = useCallback((...args) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  }, []);

  // ✅ NUEVO: Verificar que el tenant del usuario coincide con el almacenado
  const verificarTenant = useCallback(() => {
    const storedTenant = obtenerTenantActual();
    const userTenant = user?.tenant_id;
    
    if (userTenant && storedTenant !== userTenant) {
      log('⚠️ PrivateRoute - Tenant mismatch:', { storedTenant, userTenant });
      setTenantValid(false);
      return false;
    }
    
    setTenantValid(true);
    return true;
  }, [user, log]);

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
      
      if (user && estado.activa) {
        log('✅ PrivateRoute - Sesión activa, usuario:', user.email);
        // ✅ Verificar tenant
        verificarTenant();
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
  }, [user, allowedRoles, setUser, log, verificarTenant]);

  useEffect(() => {
    if (user && !isLoading) {
      log('🔒 PrivateRoute - Usuario en store, verificando permisos...');
      log('🔒 PrivateRoute - user rol:', user.rol);
      log('🔒 PrivateRoute - allowedRoles:', allowedRoles);
      
      const tienePermiso = allowedRoles.includes(user.rol);
      setIsAuthorized(tienePermiso);
      verificarTenant();  // ✅ Verificar tenant
      setIsVerifying(false);
      
      if (!tienePermiso) {
        log('❌ PrivateRoute - Rol no autorizado:', user.rol);
      } else {
        log('✅ PrivateRoute - Acceso permitido para:', user.rol);
      }
      return;
    }
    
    if (!user && !isLoading) {
      verificarSesion();
    }
  }, [user, isLoading, allowedRoles, verificarSesion, log, verificarTenant]);

  // ✅ NUEVO: Si el tenant no es válido, redirigir a login
  if (!tenantValid) {
    log('❌ PrivateRoute - Tenant inválido, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

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

  if (!user || !isAuthorized) {
    log('❌ PrivateRoute - Redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;