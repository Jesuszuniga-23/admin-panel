// src/routes/AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Verificar2FA from '../pages/auth/Verificar2FA';
import AdminLayout from '../components/layout/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import PersonalList from '../pages/admin/personal/PersonalList';
import PersonalForm from '../pages/admin/personal/PersonalForm';
import PersonalDetail from '../pages/admin/personal/PersonalDetail';
import AlertasExpiradas from '../pages/admin/alertas/AlertasExpiradas';
import PrivateRoute from './PrivateRoute';
import AlertasCerradasManual from '../pages/admin/alertas/AlertasCerradasManual';
import RecuperacionesPendientes from '../pages/admin/recuperaciones/RecuperacionesPendientes';
import UnidadesList from '../pages/admin/unidades/UnidadesList';
import UnidadForm from '../pages/admin/unidades/UnidadForm';
import UnidadDetail from '../pages/admin/unidades/UnidadDetail';
import AlertaDetail from '../pages/admin/alertas/AlertaDetail';
import ReasignacionesPendientes from '../pages/admin/reasignaciones/ReasignacionesPendientes';
import ReportesMenu from '../pages/admin/reportes/ReportesMenu';
import GeneradorReporte from '../pages/admin/reportes/GeneradorReporte';
import Perfil from '../pages/admin/Perfil';
import AlertasActivas from '../pages/admin/alertas/AlertasActivas';
import AlertasEnProceso from '../pages/admin/alertas/AlertasEnProceso';
import AlertasCerradas from '../pages/admin/alertas/AlertasCerradas';
import AlertaPanelDetail from '../pages/admin/alertas/AlertaPanelDetail';
import AnalisisGeografico from '../pages/admin/analisis/AnalisisGeografico';
import AlertaExpiradaDetail from '../pages/admin/alertas/AlertaExpiradaDetail';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppRouter = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verificar-2fa" element={<Verificar2FA />} />

          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin', 'superadmin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="personal" element={<PersonalList />} />
            <Route path="personal/crear" element={<PersonalForm />} />
            <Route path="personal/editar/:id" element={<PersonalForm />} />
            <Route path="personal/:id" element={<PersonalDetail />} />
            <Route path="alertas/activas" element={<AlertasActivas />} />
            <Route path="alertas/en-proceso" element={<AlertasEnProceso />} />
            <Route path="alertas/cerradas" element={<AlertasCerradas />} />
            <Route path="alertas/:id" element={<AlertaPanelDetail />} />
            <Route path="alertas/expiradas" element={<AlertasExpiradas />} />
            <Route path="alertas/cerradas-manual" element={<AlertasCerradasManual />} />
            <Route path="recuperaciones/pendientes" element={<RecuperacionesPendientes />} />
            <Route path="unidades" element={<UnidadesList />} />
            <Route path="unidades/crear" element={<UnidadForm />} />
            <Route path="unidades/editar/:id" element={<UnidadForm />} />
            <Route path="unidades/:id" element={<UnidadDetail />} />
            <Route path="reasignaciones/pendientes" element={<ReasignacionesPendientes />} />
            <Route path="reportes" element={<ReportesMenu />} />
            <Route path="reportes/:tipo" element={<GeneradorReporte />} />
            <Route path="analisis/geografico" element={<AnalisisGeografico />} />
            <Route index element={<Navigate to="/admin/dashboard" />} />
          </Route>

          <Route path="/superadmin" element={
            <PrivateRoute allowedRoles={['superadmin']}>
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route index element={<Navigate to="/superadmin/dashboard" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default AppRouter;