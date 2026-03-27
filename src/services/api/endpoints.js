// src/services/api/endpoints.js
const BASE_URL = import.meta.env.VITE_API_URL;

export const ENDPOINTS = {
  AUTH: {
    GOOGLE_ADMIN_LOGIN: `${BASE_URL}/auth/google-admin-login`,
    GOOGLE_LOGIN: `${BASE_URL}/auth/login/google`,
    GOOGLE_CALLBACK: `${BASE_URL}/auth/login/google/callback`,
    VERIFY_2FA: `${BASE_URL}/auth/verify-2fa`,
    RESEND_2FA: `${BASE_URL}/auth/resend-2fa`,
    SESSION_STATUS: `${BASE_URL}/auth/session-status`,
    ACTIVITY: `${BASE_URL}/auth/activity`,
    REFRESH: `${BASE_URL}/auth/refresh`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    ME: `${BASE_URL}/auth/me`
  },
  
  PERSONAL: {
    LIST: `${BASE_URL}/admin/personal`,
    GET: (id) => `${BASE_URL}/admin/personal/${id}`,
    CREATE: `${BASE_URL}/admin/personal`,
    UPDATE: (id) => `${BASE_URL}/admin/personal/${id}`,
    PATCH: (id) => `${BASE_URL}/admin/personal/${id}`,
    DELETE: (id) => `${BASE_URL}/admin/personal/${id}`,
    TOGGLE_ACTIVO: (id) => `${BASE_URL}/admin/personal/${id}/activar`,
    RESTAURAR: (id) => `${BASE_URL}/admin/personal/${id}/restaurar`
  },

  UNIDADES: {
    LIST: `${BASE_URL}/admin/unidades`,
    GET: (id) => `${BASE_URL}/admin/unidades/${id}`,
    CREATE: `${BASE_URL}/admin/unidades`,
    UPDATE: (id) => `${BASE_URL}/admin/unidades/${id}`,
    DELETE: (id) => `${BASE_URL}/admin/unidades/${id}`,
    RESTAURAR: (id) => `${BASE_URL}/admin/unidades/${id}/restaurar`,
    ASIGNAR: (id) => `${BASE_URL}/admin/unidades/${id}/asignar`,
    REMOVER: (id) => `${BASE_URL}/admin/unidades/${id}/remover`,
    PERSONAL_DISPONIBLE: (id) => `${BASE_URL}/admin/unidades/${id}/disponibles`,
    TOGGLE_ACTIVA: (id) => `${BASE_URL}/admin/unidades/${id}/toggle-activa`
  },

  ALERTAS: {
    EXPIRADAS: `${BASE_URL}/admin/alertas/expiradas`,
    CERRADAS_MANUAL: `${BASE_URL}/admin/alertas/cerradas-manual`,
    ESTADISTICAS: `${BASE_URL}/admin/alertas/estadisticas-no-atendidas`,
    CERRAR_INDIVIDUAL: (id) => `${BASE_URL}/admin/alertas/${id}/cerrar-manual`,
    CERRAR_MASIVO: `${BASE_URL}/admin/alertas/cerrar-masivo`,
    FORZAR_EXPIRACION: `${BASE_URL}/admin/alertas/forzar-expiracion`
  },
  
  ALERTAS_PANEL: {
    ACTIVAS: `${BASE_URL}/admin/alertas-panel/activas`,
    EN_PROCESO: `${BASE_URL}/admin/alertas-panel/en-proceso`,
    CERRADAS: `${BASE_URL}/admin/alertas-panel/cerradas`,
    DETALLE: (id) => `${BASE_URL}/admin/alertas-panel/${id}`,
    SOLICITAR_OTP: (id) => `${BASE_URL}/admin/alertas-panel/${id}/solicitar-otp`,
    VERIFICAR_OTP: (id) => `${BASE_URL}/admin/alertas-panel/${id}/verificar-otp`
  },  

  REASIGNACIONES: {
    PENDIENTES: `${BASE_URL}/admin/reasignaciones/pendientes`,
    UNIDADES_DISPONIBLES: (alertaId) => `${BASE_URL}/admin/reasignaciones/${alertaId}/disponibles`,
    REASIGNAR: (alertaId) => `${BASE_URL}/admin/reasignaciones/${alertaId}`
  },

  RECUPERACIONES: {
    PENDIENTES: `${BASE_URL}/admin/recuperaciones/pendientes`,
    APROBAR: (id) => `${BASE_URL}/admin/recuperaciones/${id}/aprobar`,
    RECHAZAR: (id) => `${BASE_URL}/admin/recuperaciones/${id}/rechazar`
  },

  SECURITY: {
    REPORT_VIOLATION: `${BASE_URL}/security/report-violation`,
    SCRIPT: `${BASE_URL}/security/script.js`
  },
  
  // ✅ Mejor organizado como los demás módulos
  DASHBOARD: {
    COMPLETO: `${BASE_URL}/admin/dashboard/completo`,
    // Puedes agregar más endpoints de dashboard aquí si es necesario
    // ESTADISTICAS: `${BASE_URL}/admin/dashboard/estadisticas`,
    // ACTIVIDAD_RECIENTE: `${BASE_URL}/admin/dashboard/actividad-reciente`,
  },
  ANALISIS_GEOGRAFICO: {
    COMPLETO: `${BASE_URL}/admin/analisis-geografico/completo`
}
};

// ✅ Función de utilidad para verificar endpoints
export const isValidEndpoint = (endpoint) => {
  return endpoint && typeof endpoint === 'string' && endpoint.startsWith(BASE_URL);
};

// ✅ Función para obtener la URL completa (útil para debugging)
export const getFullUrl = (endpoint) => {
  if (typeof endpoint === 'function') {
    return endpoint;
  }
  return endpoint;
};