// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRouter from './routes/AppRouter';
import useAuthStore from './store/authStore';
import { SecurityGuard } from './components/common/SecurityGuard';

function App() {
  const { initFromService, isLoading } = useAuthStore();

  useEffect(() => {
    console.log('🚀 App iniciando, inicializando auth...');
    initFromService();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SecurityGuard />
      <AppRouter />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;