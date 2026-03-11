import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      
      setUser: (userData) => {
        console.log("📝 Store actualizado:", userData?.email);
        set({ user: userData, isLoading: false });
        
        // 🔥 SOLO guardar en localStorage si es admin o superadmin
        if (userData && (userData.rol === 'admin' || userData.rol === 'superadmin')) {
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          localStorage.removeItem('user');
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => {
        console.log("🚪 Logout desde store");
        authService.logout();
        set({ user: null, isLoading: false });
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        
        // Forzar redirección en TODAS las pestañas
        window.location.href = '/login';
      },
      
      initFromService: async () => {
        console.log("🔄 Inicializando store desde servicio...");
        const user = authService.getCurrentUser();
        if (user) {
          set({ user, isLoading: false });
        } else {
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

// Escuchar cambios en localStorage para sincronizar logout
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' && !e.newValue) {
      console.log("🚪 Logout detectado en otra pestaña");
      // Alguien hizo logout, redirigir inmediatamente
      window.location.href = '/login';
    }
  });
}

export default useAuthStore;