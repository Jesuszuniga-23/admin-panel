import axiosInstance from './api/axiosConfig';
import { ENDPOINTS } from './api/endpoints';

class AuthService {
  #currentUser = null;

  async loginWithGoogle(token) {
  try {
    if (!token) {
      throw new Error('No se recibió el token de Google');
    }

    console.log("📤 Enviando token al backend...");
    
    const response = await axiosInstance.post(ENDPOINTS.AUTH.GOOGLE_ADMIN_LOGIN, {
      idToken: token
    });
    
    console.log("✅ Respuesta del backend:", response.data);
    
    if (response.data?.success) {
      // Guardar en memoria temporalmente
      this.#currentUser = response.data.usuario;
      
      // ✅ IMPORTANTE: NO guardar en localStorage aquí
      // El Login.jsx decidirá si guardar o no según el rol
      
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error("❌ Error:", error);
    throw error.response?.data || { error: 'Error de autenticación' };
  }
}

 async logout() {
  try {
    await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
  } catch (error) {
    console.error("Error en logout API:", error);
  } finally {
    this.#currentUser = null;
    // Limpiar TODO
    localStorage.removeItem('user');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth-storage');
    sessionStorage.clear();
    
    // Redirigir
    window.location.href = '/login';
  }
}
  async checkSession() {
    try {
      // Verificar si hay usuario en localStorage
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        return false;
      }

      // Verificar con backend
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
      localStorage.removeItem('auth_timestamp');
      return false;
    }
  }

  getCurrentUser() {
    // Si hay en memoria, usarlo
    if (this.#currentUser) {
      return this.#currentUser;
    }
    
    // Si no, intentar recuperar de localStorage
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
    return user?.rol === 'admin';
  }

  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user?.rol === 'superadmin';
  }
}

export default new AuthService();