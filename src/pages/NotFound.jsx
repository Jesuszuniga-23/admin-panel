// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página no encontrada</h2>
          
          <p className="text-gray-500 mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-700 font-medium"
            >
              <ArrowLeft size={18} />
              Volver atrás
            </button>
            
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md"
            >
              <Home size={18} />
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;