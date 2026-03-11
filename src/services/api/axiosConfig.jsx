import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// INTERCEPTOR DE RESPUESTA - AHORA USA retryAfter
// =====================================================
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 429) {
      return Promise.reject(error);
    }

    console.log('⏳ Rate limit alcanzado:', error.response.data);

    // 🔥 NUEVO: Leer los datos mejorados del backend
    const errorData = error.response.data || {};
    const retryAfter = errorData.retryAfter || 60; // segundos
    const mensaje = errorData.message || 'Demasiadas peticiones';
    const esAdmin = errorData.esAdmin || false;

    // Guardar en localStorage con el tiempo REAL del backend
    const rateLimitInfo = {
      activo: true,
      timestamp: Date.now(),
      expira: Date.now() + (retryAfter * 1000),
      mensaje,
      retryAfter,
      esAdmin
    };
    
    localStorage.setItem('rate_limit_info', JSON.stringify(rateLimitInfo));
    window.dispatchEvent(new CustomEvent('rate-limit-activated', { 
      detail: rateLimitInfo 
    }));

    // Toast con el tiempo exacto
    toast.error(mensaje, { 
      duration: Math.min(retryAfter * 1000, 10000) // Máximo 10 segundos
    });

    // Reintentar automático para admins
    if (!originalRequest._retry && esAdmin) {
      originalRequest._retry = true;
      
      setTimeout(() => {
        toast.loading('🔄 Reintentando...', { duration: 2000 });
        return axiosInstance(originalRequest);
      }, retryAfter * 1000);
    }

    return Promise.reject({
      ...error,
      rateLimit: true,
      rateLimitInfo: { retryAfter, mensaje, esAdmin }
    });
  }
);

export const checkRateLimit = () => {
  const stored = localStorage.getItem('rate_limit_info');
  if (!stored) return null;
  
  try {
    const info = JSON.parse(stored);
    if (Date.now() > info.expira) {
      localStorage.removeItem('rate_limit_info');
      window.dispatchEvent(new CustomEvent('rate-limit-cleared'));
      return null;
    }
    return info;
  } catch {
    localStorage.removeItem('rate_limit_info');
    return null;
  }
};

export default axiosInstance;