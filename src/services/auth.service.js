import axiosInstance from './api/axiosConfig';
import { ENDPOINTS } from './api/endpoints';

class AuthService {
  #currentUser = null;

  async loginWithGoogle(token, options = {}) {
    try {
      if (!token) {
        throw new Error('No se recibió el token de Google');
      }

      console.log("📧 Enviando token al backend...");
      
      const config = {};
      if (options.signal) {
        config.signal = options.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.AUTH.GOOGLE_ADMIN_LOGIN, {
        idToken: token
      }, config);
      
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

  // =====================================================
  // ✅ FUNCIONES CORREGIDAS
  // =====================================================

  puedeCrearPersonal(rolACrear) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    const permisos = {
      superadmin: true,
      admin: [
        'admin',              // Administradores
        'operador_tecnico',   // Operadores técnicos
        'operador_general',   // Operadores generales
        'operador_policial',  // Operadores policiales
        'operador_medico',    // Operadores médicos
        'policia',            // Policías de campo
        'paramedico'          // Paramédicos de campo
      ],
      operador_policial: ['policia'],
      operador_medico: ['paramedico'],
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
      admin: true,  // ✅ CORREGIDO: Admin SÍ puede crear unidades
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
    
    // ✅ CORREGIDO: Admin puede editar cualquier rol excepto superadmin
    if (rolUsuario === 'admin') {
      return rolPersonal !== 'superadmin';
    }
    
    if (rolUsuario === 'operador_policial') return rolPersonal === 'policia';
    if (rolUsuario === 'operador_medico') return rolPersonal === 'paramedico';
    if (rolUsuario === 'operador_tecnico') return false;
    if (rolUsuario === 'operador_general') return false;
    
    return false;
  }
  
  puedeEliminarPersonal(rolPersonal) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolUsuario = user.rol;
    
    // ✅ CORREGIDO: Superadmin no puede eliminarse a sí mismo
    if (rolUsuario === 'superadmin') {
      return rolPersonal !== 'superadmin';
    }
    
    // ✅ CORREGIDO: Admin puede eliminar cualquier rol excepto superadmin y admin
    if (rolUsuario === 'admin') {
      return rolPersonal !== 'superadmin' && rolPersonal !== 'admin';
    }
    
    if (rolUsuario === 'operador_policial') return rolPersonal === 'policia';
    if (rolUsuario === 'operador_medico') return rolPersonal === 'paramedico';
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
    if (rolUsuario === 'admin') return true;  // ✅ Admin SÍ puede editar unidades
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