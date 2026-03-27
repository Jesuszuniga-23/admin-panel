// src/components/layout/AdminLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import RateLimitBanner from "../common/RateLimitBanner";
import SessionMonitor from '../common/SessionMonitor';
// import SecurityGuard from '../common/SecurityGuard';    // ← COMENTAR TEMPORALMENTE

// ✅ Roles que tienen acceso al layout admin
const ROLES_ADMIN = ['admin', 'superadmin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];

const AdminLayout = () => {
  const { user, isLoading, setLoading } = useAuthStore();
  const [timeoutError, setTimeoutError] = useState(false);

  // ✅ Timeout para loading infinito (máximo 5 segundos)
  useEffect(() => {
    let timeoutId;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        console.warn('⚠️ AdminLayout: Loading timeout después de 5 segundos');
        setTimeoutError(true);
        setLoading(false);
      }, 5000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, setLoading]);

  // ✅ Verificar si el usuario tiene rol válido para admin
  const tieneAccesoAdmin = () => {
    if (!user) return false;
    return ROLES_ADMIN.includes(user.rol);
  };

  // ✅ Estado de loading con timeout
  if (isLoading || timeoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {timeoutError ? 'Tiempo de espera agotado. Recargando...' : 'Cargando...'}
          </p>
          {timeoutError && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Recargar página
            </button>
          )}
        </div>
      </div>
    );
  }

  // ✅ Redirigir si no hay usuario o no tiene rol válido
  if (!user) {
    console.log('🔒 AdminLayout: No hay usuario, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  if (!tieneAccesoAdmin()) {
    console.log(`🔒 AdminLayout: Usuario con rol "${user.rol}" no tiene acceso al panel admin`);
    
    // ✅ Si es ciudadano, redirigir a app móvil
    if (user.rol === 'ciudadano') {
      return <Navigate to="/mobile" replace />;
    }
    
    // ✅ Otros roles no autorizados
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* <SecurityGuard /> */}  {/* ← COMENTADO */}
      
      {/* ✅ SessionMonitor dentro del fragment principal */}
      <SessionMonitor />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
      <RateLimitBanner />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default AdminLayout;