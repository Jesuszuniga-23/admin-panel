// src/services/api/axiosConfig.jsx (MODIFICADO - AGREGAR TENANT HEADER)
import axios from 'axios';
import toast from 'react-hot-toast';
import { obtenerTenantActual } from '../../utils/storage';  // ✅ NUEVO

const API_URL = import.meta.env.VITE_API_URL;

console.log('🔧 API_URL configurada:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// =====================================================
// ✅ INTERCEPTOR DE PETICIÓN - AGREGAR HEADER X-Tenant-ID
// =====================================================
axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ Agregar tenant_id a cada petición
    const tenantId = obtenerTenantActual();
    config.headers['X-Tenant-ID'] = tenantId;
    
    console.log(`📡 [REQUEST] ${config.method?.toUpperCase()} ${config.url} | Tenant: ${tenantId}`);
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
    
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log(`🛑 [CANCELED] ${originalRequest?.url} - Petición cancelada`);
      return Promise.reject(error);
    }
    
    if (error.message === 'Network Error' || !error.response) {
      console.error('🌐 [NETWORK ERROR] No hay conexión con el servidor');
      toast.error('Error de conexión. Verifica tu internet.', {
        duration: 5000,
        icon: '🌐'
      });
      return Promise.reject({
        ...error,
        networkError: true,
        message: 'No hay conexión con el servidor'
      });
    }
    
    console.error('❌ [RESPONSE ERROR]', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // ✅ Manejo de error TENANT_MISMATCH
    if (error.response?.status === 403 && error.response?.data?.code === 'TENANT_MISMATCH') {
      console.error('🏢 Tenant mismatch detectado');
      toast.error('No tienes permisos para acceder a este municipio', {
        duration: 5000,
        icon: '🏢'
      });
      // Opcional: redirigir a logout o recargar
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }

    // ✅ Manejo de error TENANT_NOT_FOUND
    if (error.response?.status === 403 && error.response?.data?.code === 'TENANT_NOT_FOUND') {
      console.error('🏢 Tenant no encontrado');
      toast.error('Municipio no registrado o inactivo', {
        duration: 5000,
        icon: '🏢'
      });
    }

    // Manejo de rate limit (429)
    if (error.response?.status === 429) {
      console.log('⏱️ Rate limit alcanzado:', error.response.data);

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

      toast.error(`${mensaje} Espera ${retryAfter} segundos.`, { 
        duration: Math.min(retryAfter * 1000, 10000) 
      });

      if (!originalRequest._retry && esAdmin) {
        originalRequest._retry = true;
        
        const retryPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            console.log(`🔄 Reintentando petición a ${originalRequest.url}...`);
            toast.loading('Reintentando...', { duration: 2000 });
            resolve(axiosInstance(originalRequest));
          }, retryAfter * 1000);
        });
        
        return retryPromise;
      }

      return Promise.reject({
        ...error,
        rateLimit: true,
        rateLimitInfo: { retryAfter, mensaje, esAdmin }
      });
    }

    if (error.response?.status === 401) {
      console.warn('⚠️ Sesión expirada o no autenticado');
      
      const rateLimitInfo = checkRateLimit();
      if (rateLimitInfo) {
        console.log('⏱️ Rate limit activo, no mostrar error 401');
        return Promise.reject({
          ...error,
          rateLimit: true,
          rateLimitInfo
        });
      }
      
      error.authError = true;
      error.message = error.response?.data?.message || 'Sesión expirada';
    }

    if (error.code === 'ECONNABORTED') {
      console.error('⏰ [TIMEOUT] La petición tardó demasiado tiempo');
      toast.error('La petición ha tardado demasiado. Intenta nuevamente.', {
        duration: 5000
      });
      return Promise.reject({
        ...error,
        timeoutError: true,
        message: 'Tiempo de espera agotado'
      });
    }

    if (error.response?.status === 500) {
      console.error('🔥 [SERVER ERROR] Error interno del servidor');
      toast.error('Error en el servidor. Intenta más tarde.', {
        duration: 5000
      });
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

export const clearRateLimit = () => {
  localStorage.removeItem('rate_limit_info');
  window.dispatchEvent(new CustomEvent('rate-limit-cleared'));
  console.log('🧹 Rate limit info limpiado manualmente');
};

export const getRateLimitRemainingTime = () => {
  const info = checkRateLimit();
  if (!info) return 0;
  
  const remaining = Math.max(0, Math.ceil((info.expira - Date.now()) / 1000));
  return remaining;
};

export default axiosInstance;