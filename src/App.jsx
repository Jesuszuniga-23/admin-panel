import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import PrivateRoute from './routes/PrivateRoute';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* 🏠 LANDING PAGE - Página principal */}
          <Route path="/" element={<Home />} />
          
          {/* 🔐 LOGIN - Acceso administrativo */}
          <Route path="/login" element={<Login />} />

          {/* 🛡️ RUTAS PROTEGIDAS - Admin Dashboard */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin', 'superadmin']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route index element={<Navigate to="/admin/dashboard" />} />
          </Route>

          {/* 👑 RUTAS PROTEGIDAS - SuperAdmin Dashboard */}
          <Route path="/superadmin" element={
            <PrivateRoute allowedRoles={['superadmin']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route index element={<Navigate to="/superadmin/dashboard" />} />
            
          </Route>

          {/* 404 - Redirigir a Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;