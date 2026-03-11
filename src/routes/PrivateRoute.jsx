import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect, useState } from 'react';

const PrivateRoute = ({ children, allowedRoles = ['admin', 'superadmin'] }) => {
  const { user, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Pequeño delay para evitar flash
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Mostrar loader SOLO en carga inicial
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    console.log("🚫 No hay usuario, redirigiendo...");
    return <Navigate to="/login" replace />;
  }

  // Verificar rol
  if (!allowedRoles.includes(user.rol)) {
    console.log("🚫 Rol no autorizado:", user.rol);
    return <Navigate to="/login" replace />;
  }

  // Todo bien, mostrar contenido
  console.log("✅ Acceso permitido para:", user.rol);
  return children;
};

export default PrivateRoute;