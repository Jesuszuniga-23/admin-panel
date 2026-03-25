// src/services/auth.service.js
import axiosInstance from './api/axiosConfig';
import { ENDPOINTS } from './api/endpoints';

class AuthService {
  #currentUser = null;

  async loginWithGoogle(token) {
    try {
      if (!token) {
        throw new Error('No se recibió el token de Google');
      }

      console.log("📧 Enviando token al backend...");
      
      const response = await axiosInstance.post(ENDPOINTS.AUTH.GOOGLE_ADMIN_LOGIN, {
        idToken: token
      });
      
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error.response?.data || { error: 'Error de autenticación' };
    }
  }

  // ✅ CORRECTO - NO recibe pendingToken
  async verificar2FA(codigo) {
  try {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.VERIFY_2FA, {
      codigo
    });
    console.log('🔐 Respuesta de verificar2FA:', response.data);
    return response.data;  // Debe tener { success: true, usuario: {...} }
  } catch (error) {
    console.error("Error verificando 2FA:", error);
    throw error.response?.data || { error: 'Error al verificar código' };
  }
}


  // ✅ CORRECTO - NO recibe pendingToken
  async reenviarCodigo2FA() {
    try {
      const response = await axiosInstance.post(ENDPOINTS.AUTH.RESEND_2FA, {});
      return response.data;
    } catch (error) {
      console.error("Error reenviando código:", error);
      throw error.response?.data || { error: 'Error al reenviar código' };
    }
  }

  async obtenerEstadoSesion() {
    try {
      const response = await axiosInstance.get(ENDPOINTS.AUTH.SESSION_STATUS);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estado de sesión:", error);
      return { activa: false, motivo: 'Error de conexión' };
    }
  }

  async registrarActividad() {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.ACTIVITY);
    } catch (error) {
      console.debug("Error registrando actividad:", error);
    }
  }

  async logout() {
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
      
      window.location.href = '/login';
    }
  }

  async checkSession() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return false;
      }

      const response = await axiosInstance.get(ENDPOINTS.AUTH.ME);
      
      if (response.data?.user) {
        this.#currentUser = response.data.user;
        return true;
      }
      
      return false;
    } catch (error) {
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
    if (user?.rol === 'operador_policial') return 'panico';
    if (user?.rol === 'operador_medico') return 'medica';
    return null;
  }

  getRolPersonalPermitido() {
    const user = this.getCurrentUser();
    if (user?.rol === 'operador_policial') return 'policia';
    if (user?.rol === 'operador_medico') return 'ambulancia';
    return null;
  }

  puedeModificarPersonal(rolPersonal) {
    const user = this.getCurrentUser();
    if (user?.rol === 'admin' || user?.rol === 'superadmin') return true;
    if (user?.rol === 'operador_tecnico') return false;
    if (user?.rol === 'operador_policial') return rolPersonal === 'policia';
    if (user?.rol === 'operador_medico') return rolPersonal === 'ambulancia';
    return false;
  }

  puedeGestionarAlerta(tipoAlerta) {
    const user = this.getCurrentUser();
    if (user?.rol === 'admin' || user?.rol === 'superadmin') return true;
    if (user?.rol === 'operador_tecnico') return true;
    if (user?.rol === 'operador_policial') return tipoAlerta === 'panico';
    if (user?.rol === 'operador_medico') return tipoAlerta === 'medica';
    return false;
  }
}

export default new AuthService();