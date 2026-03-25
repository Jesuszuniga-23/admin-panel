// src/services/api/axiosConfig.jsx
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

console.log('🔧 API_URL configurada:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
});

// Interceptor de petición para logs
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`📡 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ [REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPUESTA
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ [RESPONSE] ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detallado del error
    console.error('❌ [RESPONSE ERROR]', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Manejo de rate limit (429)
    if (error.response?.status === 429) {
      console.log('Rate limit alcanzado:', error.response.data);

      const errorData = error.response.data || {};
      const retryAfter = errorData.retryAfter || 60;
      const mensaje = errorData.message || 'Demasiadas peticiones';
      const esAdmin = errorData.esAdmin || false;

      const rateLimitInfo = {
        activo: true,
        timestamp: Date.now(),
        expira: Date.now() + (retryAfter * 1000),
        mensaje,
        retryAfter,
        esAdmin
      };
      
      localStorage.setItem('rate_limit_info', JSON.stringify(rateLimitInfo));
      window.dispatchEvent(new CustomEvent('rate-limit-activated', { detail: rateLimitInfo }));

      toast.error(mensaje, { duration: Math.min(retryAfter * 1000, 10000) });

      if (!originalRequest._retry && esAdmin) {
        originalRequest._retry = true;
        setTimeout(() => {
          toast.loading('Reintentando...', { duration: 2000 });
          return axiosInstance(originalRequest);
        }, retryAfter * 1000);
      }

      return Promise.reject({
        ...error,
        rateLimit: true,
        rateLimitInfo: { retryAfter, mensaje, esAdmin }
      });
    }

    // Manejo de errores de autenticación (401)
    if (error.response?.status === 401) {
      console.warn('⚠️ Sesión expirada o no autenticado');
      // No redirigir automáticamente, dejar que el componente maneje
    }

    return Promise.reject(error);
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