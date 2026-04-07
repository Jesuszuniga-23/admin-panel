// src/services/auth.service.js (MODIFICADO - AGREGAR TENANT)
import axiosInstance from './api/axiosConfig';
import { ENDPOINTS } from './api/endpoints';
import { guardarTenant, obtenerTenantActual } from '../utils/storage';  // ✅ NUEVO

class AuthService {
  #currentUser = null;

  async loginWithGoogle(token, options = {}) {
    try {
      if (!token) {
        throw new Error('No se recibió el token de Google');
      }

      // ✅ Obtener tenant actual (si existe)
      const tenantId = obtenerTenantActual();
      console.log(`🔐 Iniciando login con Google | Tenant: ${tenantId}`);

      console.log("📧 Enviando token al backend...");
      
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      // ✅ Agregar tenant al body de la petición
      const response = await axiosInstance.post(ENDPOINTS.AUTH.GOOGLE_ADMIN_LOGIN, {
        idToken: token,
        tenant_id: tenantId  // ✅ NUEVO: enviar tenant
      }, config);
      
      // ✅ Guardar tenant si viene en la respuesta
      if (response.data?.usuario?.tenant_id) {
        guardarTenant(response.data.usuario.tenant_id);
        console.log(`🏢 Tenant guardado: ${response.data.usuario.tenant_id}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error:", error);
      throw error.response?.data || { error: 'Error de autenticación' };
    }
  }

  async verificar2FA(codigo, options = {}) {
    try {
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.AUTH.VERIFY_2FA, {
        codigo
      }, config);
      
      console.log('🔐 Respuesta de verificar2FA:', response.data);
      
      // ✅ Guardar tenant si viene en la respuesta
      if (response.data?.usuario?.tenant_id) {
        guardarTenant(response.data.usuario.tenant_id);
        console.log(`🏢 Tenant guardado: ${response.data.usuario.tenant_id}`);
      }
      
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error verificando 2FA:", error);
      throw error.response?.data || { error: 'Error al verificar código' };
    }
  }

  async reenviarCodigo2FA(options = {}) {
    try {
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.AUTH.RESEND_2FA, {}, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error reenviando código:", error);
      throw error.response?.data || { error: 'Error al reenviar código' };
    }
  }

  async obtenerEstadoSesion(options = {}) {
    try {
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      const response = await axiosInstance.get(ENDPOINTS.AUTH.SESSION_STATUS, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error obteniendo estado de sesión:", error);
      return { activa: false, motivo: 'Error de conexión' };
    }
  }

  async registrarActividad(options = {}) {
    try {
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      await axiosInstance.post(ENDPOINTS.AUTH.ACTIVITY, {}, config);
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.debug("Error registrando actividad:", error);
    }
  }

  async logout(navigate = null) {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Error en logout API:", error);
    } finally {
      this.#currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('auth_timestamp');
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('pending_2fa_token');
      localStorage.removeItem('tenant_id');  // ✅ NUEVO: limpiar tenant
      
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('dashboard_cache_') || key.startsWith('dashboard_cache_time_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Limpiadas ${keysToRemove.length} entradas de caché del dashboard`);
      
      sessionStorage.clear();
      
      if (navigate && typeof navigate === 'function') {
        navigate('/login', { replace: true });
      } else {
        window.location.href = '/login';
      }
    }
  }

  async checkSession(options = {}) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return false;
      }

      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }

      const response = await axiosInstance.get(ENDPOINTS.AUTH.ME, config);
      
      if (response.data?.user) {
        this.#currentUser = response.data.user;
        // ✅ Asegurar que el tenant está sincronizado
        if (response.data.user.tenant_id) {
          guardarTenant(response.data.user.tenant_id);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error verificando sesión:", error);
      this.#currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('tenant_id');  // ✅ NUEVO
      return false;
    }
  }

  getCurrentUser() {
    if (this.#currentUser) {
      return this.#currentUser;
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.#currentUser = JSON.parse(userStr);
        return this.#currentUser;
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
    
    return null;
  }

  // ✅ NUEVO: Obtener tenant actual del usuario
  getCurrentTenant() {
    const user = this.getCurrentUser();
    return user?.tenant_id || obtenerTenantActual() || 'default';
  }

  isAuthenticated() {
    return !!this.getCurrentUser();
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  }

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.rol === 'superadmin';
  }

  isOperadorTecnico() {
    const user = this.getCurrentUser();
    return user?.rol === 'operador_tecnico';
  }

  isOperadorPolicial() {
    const user = this.getCurrentUser();
    return user?.rol === 'operador_policial';
  }

  isOperadorMedico() {
    const user = this.getCurrentUser();
    return user?.rol === 'operador_medico';
  }

  isOperadorGeneral() {
    const user = this.getCurrentUser();
    return user?.rol === 'operador_general';
  }

  getTipoAlertaPermitido() {
    const user = this.getCurrentUser();
    if (!user) return null;
    if (user.rol === 'operador_policial') return 'panico';
    if (user.rol === 'operador_medico') return 'medica';
    return null;
  }

  getRolPersonalPermitido() {
    const user = this.getCurrentUser();
    if (!user) return null;
    if (user.rol === 'operador_policial') return 'policia';
    if (user.rol === 'operador_medico') return 'paramedico';
    return null;
  }

  getTipoUnidadPermitido() {
    const user = this.getCurrentUser();
    if (!user) return null;
    if (user.rol === 'operador_policial') return 'patrulla';
    if (user.rol === 'operador_medico') return 'ambulancia';
    return null;
  }

  puedeCrearPersonal(rolACrear) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    const permisos = {
      superadmin: true,
      admin: [
        'admin', 'operador_tecnico', 'operador_general',
        'operador_policial', 'operador_medico',
        'policia', 'paramedico'
      ],
      operador_policial: ['policia', 'operador_policial'],
      operador_medico: ['paramedico', 'operador_medico'],
      operador_tecnico: [],
      operador_general: []
    };
    
    if (rolUsuario === 'superadmin') return true;
    return permisos[rolUsuario]?.includes(rolACrear) || false;
  }
  
  puedeCrearUnidad(tipoUnidad) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    if (!['patrulla', 'ambulancia'].includes(tipoUnidad)) {
      console.warn(`⚠️ Tipo de unidad inválido: ${tipoUnidad}`);
      return false;
    }
    
    const permisos = {
      superadmin: true,
      admin: true,
      operador_policial: tipoUnidad === 'patrulla',
      operador_medico: tipoUnidad === 'ambulancia',
      operador_tecnico: true,
      operador_general: false
    };
    
    if (rolUsuario === 'superadmin') return true;
    return permisos[rolUsuario] || false;
  }
  
  puedeEditarPersonal(rolPersonal) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    if (rolUsuario === 'superadmin') return true;
    if (rolUsuario === 'admin') {
      return rolPersonal !== 'superadmin';
    }
    if (rolUsuario === 'operador_policial') {
      return rolPersonal === 'policia' || rolPersonal === 'operador_policial';
    }
    if (rolUsuario === 'operador_medico') {
      return rolPersonal === 'paramedico' || rolPersonal === 'operador_medico';
    }
    if (rolUsuario === 'operador_tecnico') return false;
    if (rolUsuario === 'operador_general') return false;
    
    return false;
  }
  
  puedeEliminarPersonal(rolPersonal) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    if (rolUsuario === 'superadmin') {
      return rolPersonal !== 'superadmin';
    }
    if (rolUsuario === 'admin') {
      return rolPersonal !== 'superadmin';
    }
    if (rolUsuario === 'operador_policial') {
      return rolPersonal === 'policia' || rolPersonal === 'operador_policial';
    }
    if (rolUsuario === 'operador_medico') {
      return rolPersonal === 'paramedico' || rolPersonal === 'operador_medico';
    }
    if (rolUsuario === 'operador_tecnico') return false;
    if (rolUsuario === 'operador_general') return false;
    
    return false;
  }
  
  puedeEditarUnidad(tipoUnidad) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    if (!['patrulla', 'ambulancia'].includes(tipoUnidad)) {
      console.warn(`⚠️ Tipo de unidad inválido: ${tipoUnidad}`);
      return false;
    }
    
    if (rolUsuario === 'superadmin') return true;
    if (rolUsuario === 'admin') return true;
    if (rolUsuario === 'operador_policial') return tipoUnidad === 'patrulla';
    if (rolUsuario === 'operador_medico') return tipoUnidad === 'ambulancia';
    if (rolUsuario === 'operador_tecnico') return true;
    
    return false;
  }
  
  puedeEliminarUnidad(tipoUnidad) {
    return this.puedeEditarUnidad(tipoUnidad);
  }
  
  puedeModificarPersonal(rolPersonal) {
    return this.puedeEditarPersonal(rolPersonal);
  }

  puedeGestionarAlerta(tipoAlerta) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (user.rol === 'admin' || user.rol === 'superadmin') return true;
    if (user.rol === 'operador_tecnico') return true;
    if (user.rol === 'operador_policial') return tipoAlerta === 'panico';
    if (user.rol === 'operador_medico') return tipoAlerta === 'medica';
    
    return false;
  }
}

export default new AuthService();