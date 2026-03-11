// utils/storage.js
export const guardarSesion = (token, usuario) => {
  // Guardar solo datos no sensibles
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol
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
  window.location.href = '/';
};