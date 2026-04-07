// src/utils/storage.js
export const guardarSesion = (token, usuario) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    tenant_id: usuario.tenant_id || 'default'
  }));
};

export const haySesion = () => {
  return !!localStorage.getItem('auth_token') && !!localStorage.getItem('user');
};

export const obtenerUsuario = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const cerrarSesion = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant_id');
  window.location.href = '/';
};

export const guardarTenant = (tenantId) => {
  if (tenantId) {
    localStorage.setItem('tenant_id', tenantId);
    console.log(`🏢 Tenant guardado: ${tenantId}`);
  }
};

export const obtenerTenantActual = () => {
  return localStorage.getItem('tenant_id') || 'default';
};

export const limpiarTenant = () => {
  localStorage.removeItem('tenant_id');
  console.log('🏢 Tenant limpiado');
};