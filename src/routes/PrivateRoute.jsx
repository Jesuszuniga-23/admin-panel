// src/routes/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useEffect, useState } from 'react';

const PrivateRoute = ({ children, allowedRoles = ['admin', 'superadmin'] }) => {
  const { user, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    console.log("No hay usuario, redirigiendo...");
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    console.log("Rol no autorizado:", user.rol);
    return <Navigate to="/login" replace />;
  }

  console.log("Acceso permitido para:", user.rol);
  return children;
};

export default PrivateRoute;