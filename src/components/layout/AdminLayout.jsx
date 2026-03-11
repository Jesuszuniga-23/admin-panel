import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import RateLimitBanner from "../common/RateLimitBanner";
const AdminLayout = () => {
  const { user, isLoading } = useAuthStore();

  // Mostrar loader mientras carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, no renderizar nada (PrivateRoute ya redirige)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 👈 AGREGAR EL SIDEBAR AQUÍ */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
      <RateLimitBanner />
      <Toaster position="top-right" />
    </div>
  );
};

export default AdminLayout;