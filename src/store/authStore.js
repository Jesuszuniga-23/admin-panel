// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';
import { clearRateLimit } from '../services/api/axiosConfig';

const useAuthStore = create(
  persist(
    (set, get) => ({
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
      
      logout: async (navigate = null) => {
        console.log("🔴 Logout desde store");
        
        try {
          // ✅ Intentar logout en el servidor, pero no esperar
          await authService.logout(navigate);
        } catch (error) {
          console.warn('Error en logout API, continuando con logout local:', error);
        } finally {
          // ✅ Limpiar estado local
          set({ user: null, isLoading: false });
          
          // ✅ Limpiar localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('pending_2fa_token');
          
          // ✅ Limpiar rate limit info
          clearRateLimit();
          
          // ✅ Limpiar sessionStorage
          sessionStorage.clear();
          
          // ✅ Redirigir solo si no se proporcionó navigate
          if (!navigate) {
            window.location.href = '/login';
          }
        }
      },
      
      initFromService: async () => {
        console.log("🔄 Inicializando store desde servicio...");
        try {
          const user = authService.getCurrentUser();
          if (user) {
            console.log("✅ Usuario encontrado:", user.email);
            set({ user, isLoading: false });
          } else {
            console.log("⚠️ No hay usuario en localStorage");
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("❌ Error inicializando store:", error);
          set({ isLoading: false });
        }
      },
      
      // ✅ Método para actualizar solo el usuario (útil después de editar perfil)
      updateUser: (updatedUserData) => {
        console.log("🔄 Actualizando usuario en store:", updatedUserData?.email);
        const currentUser = get().user;
        const mergedUser = { ...currentUser, ...updatedUserData };
        set({ user: mergedUser });
        
        // ✅ Actualizar localStorage
        if (mergedUser) {
          localStorage.setItem('user', JSON.stringify(mergedUser));
        }
      },
      
      // ✅ Método para verificar si el usuario está autenticado
      isAuthenticated: () => {
        const { user } = get();
        return !!user;
      },
      
      // ✅ Método para obtener el rol del usuario
      getUserRole: () => {
        const { user } = get();
        return user?.rol || null;
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      // ✅ Opcional: parcializar para no guardar todo
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// ✅ Sincronización entre pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    // ✅ Si la clave 'user' se eliminó en otra pestaña
    if (e.key === 'user' && !e.newValue) {
      console.log("🔴 Logout detectado en otra pestaña");
      // ✅ Limpiar store sin redirigir inmediatamente
      useAuthStore.setState({ user: null, isLoading: false });
      // ✅ Opcional: redirigir después de un breve delay
      setTimeout(() => {
        if (!useAuthStore.getState().user) {
          window.location.href = '/login';
        }
      }, 100);
    }
    
    // ✅ Si la clave 'auth-storage' se actualizó en otra pestaña
    if (e.key === 'auth-storage' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        const currentUser = useAuthStore.getState().user;
        const newUser = newState?.state?.user;
        
        // ✅ Si el usuario cambió en otra pestaña
        if (JSON.stringify(currentUser) !== JSON.stringify(newUser)) {
          console.log("🔄 Usuario actualizado en otra pestaña");
          useAuthStore.setState({ user: newUser });
        }
      } catch (err) {
        console.error('Error parsing storage event:', err);
      }
    }
  });
}

export default useAuthStore;