// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      
      setUser: (userData) => {
        console.log("📝 Store actualizado con usuario:", userData?.email);
        console.log("📝 Rol del usuario:", userData?.rol);
        set({ user: userData, isLoading: false });
        
        const rolesWeb = ['admin', 'superadmin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
        
        if (userData && rolesWeb.includes(userData.rol)) {
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ Usuario guardado en localStorage');
        } else {
          localStorage.removeItem('user');
          console.log('⚠️ Usuario no guardado (rol no web o sin datos)');
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => {
        console.log("🔴 Logout desde store");
        authService.logout();
        set({ user: null, isLoading: false });
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      },
      
      initFromService: async () => {
        console.log("🔄 Inicializando store desde servicio...");
        const user = authService.getCurrentUser();
        if (user) {
          console.log("✅ Usuario encontrado:", user.email);
          set({ user, isLoading: false });
        } else {
          console.log("⚠️ No hay usuario en localStorage");
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' && !e.newValue) {
      console.log("🔴 Logout detectado en otra pestaña");
      window.location.href = '/login';
    }
  });
}

export default useAuthStore;