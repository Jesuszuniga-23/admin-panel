// src/routes/AppRouter.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
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
import NotFound from '../pages/NotFound';

// ✅ Logs condicionales solo en desarrollo
if (import.meta.env.DEV) {
  console.log("🔥 AppRouter cargado");
}

const AppRouter = () => {
  if (import.meta.env.DEV) {
    console.log("🔥 AppRouter renderizando - ruta:", window.location.pathname);
  }
  
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verificar-2fa" element={<Verificar2FA />} />

      {/* ✅ Rutas admin - orden correcto: específicas primero, genéricas después */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute allowedRoles={['admin', 'superadmin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        {/* Rutas principales */}
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="perfil" element={<Perfil />} />
        
        {/* Personal */}
        <Route path="personal" element={<PersonalList />} />
        <Route path="personal/crear" element={<PersonalForm />} />
        <Route path="personal/editar/:id" element={<PersonalForm />} />
        <Route path="personal/:id" element={<PersonalDetail />} />
        
        {/* Alertas - ORDEN CORRECTO: rutas específicas primero */}
        <Route path="alertas/activas" element={<AlertasActivas />} />
        <Route path="alertas/en-proceso" element={<AlertasEnProceso />} />
        <Route path="alertas/cerradas" element={<AlertasCerradas />} />
        <Route path="alertas/cerradas-manual" element={<AlertasCerradasManual />} />
        <Route path="alertas/expiradas" element={<AlertasExpiradas />} />
        {/* ✅ Ruta específica para detalle de alerta expirada - DEBE ir antes de la genérica */}
        <Route path="alertas/expiradas/:id" element={<AlertaExpiradaDetail />} />
        {/* ✅ Ruta genérica para detalle de alerta - VA DESPUÉS de las específicas */}
        <Route path="alertas/:id" element={<AlertaPanelDetail />} />
        
        {/* Recuperaciones */}
        <Route path="recuperaciones/pendientes" element={<RecuperacionesPendientes />} />
        
        {/* Unidades */}
        <Route path="unidades" element={<UnidadesList />} />
        <Route path="unidades/crear" element={<UnidadForm />} />
        <Route path="unidades/editar/:id" element={<UnidadForm />} />
        <Route path="unidades/:id" element={<UnidadDetail />} />
        
        {/* Reasignaciones */}
        <Route path="reasignaciones/pendientes" element={<ReasignacionesPendientes />} />
        
        {/* Reportes */}
        <Route path="reportes" element={<ReportesMenu />} />
        <Route path="reportes/:tipo" element={<GeneradorReporte />} />
        
        {/* Análisis */}
        <Route path="analisis/geografico" element={<AnalisisGeografico />} />
      </Route>

      {/* ✅ Ruta para superadmin (opcional, puede redirigir a admin) */}
      <Route 
        path="/superadmin" 
        element={
          <PrivateRoute allowedRoles={['superadmin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/superadmin/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* ✅ Redirigir otras rutas de superadmin a admin para evitar duplicación */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* ✅ Ruta 404 - No encontrada */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;