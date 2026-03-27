// src/App.jsx
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import useAuthStore from './store/authStore';
//import SecurityGuard from './components/common/SecurityGuard'; // ✅ CORREGIDO: exportación por defecto

// ✅ Timeout para loading infinito (10 segundos)
const LOADING_TIMEOUT = 10000;

function App() {
  const { initFromService, isLoading, setLoading } = useAuthStore();
  const [initError, setInitError] = useState(null);
  const [timeoutExcedido, setTimeoutExcedido] = useState(false);

  useEffect(() => {
    let timeoutId;
    let isMounted = true;
    
    const inicializar = async () => {
      try {
        console.log('🚀 App iniciando, inicializando auth...');
        await initFromService();
        if (isMounted) {
          console.log('✅ Autenticación inicializada correctamente');
        }
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        if (isMounted) {
          setInitError(error.message || 'Error al inicializar la aplicación');
          setLoading(false); // Asegurar que salga del loading
        }
      }
    };
    
    // ✅ Timeout para loading infinito
    timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('⚠️ Timeout en inicialización de autenticación');
        setTimeoutExcedido(true);
        setLoading(false);
      }
    }, LOADING_TIMEOUT);
    
    inicializar();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [initFromService, setLoading, isLoading]);

  // ✅ Mostrar error si hubo problema en inicialización
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 rounded-xl p-6 max-w-md text-center border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error de inicialización</h2>
          <p className="text-red-600 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Mostrar timeout si excedió el tiempo de carga
  if (timeoutExcedido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-yellow-50 rounded-xl p-6 max-w-md text-center border border-yellow-200">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">La aplicación está tardando en cargar</h2>
          <p className="text-yellow-600 mb-4">
            Esto puede deberse a problemas de conexión. Por favor, verifica tu conexión a internet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
          <p className="text-xs text-gray-400 mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
 {/* <SecurityGuard /> */}  {/* ← COMENTADO */}
       <AppRouter />
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
    </BrowserRouter>
  );
}

export default App;