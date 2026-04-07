// src/store/authStore.js (MODIFICADO - AGREGAR TENANT)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/auth.service';
import { clearRateLimit } from '../services/api/axiosConfig';
import { guardarTenant, limpiarTenant, obtenerTenantActual } from '../utils/storage';  // ✅ NUEVO

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      currentTenant: 'default',  // ✅ NUEVO: tenant actual
      
      setUser: (userData) => {
        console.log("📝 Store actualizado con usuario:", userData?.email);
        console.log("📝 Rol del usuario:", userData?.rol);
        console.log("🏢 Tenant del usuario:", userData?.tenant_id);
        
        // ✅ Guardar tenant en localStorage
        if (userData?.tenant_id) {
          guardarTenant(userData.tenant_id);
          set({ currentTenant: userData.tenant_id });
        }
        
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
      
      // ✅ NUEVO: cambiar tenant manualmente (solo para superadmin)
      setCurrentTenant: (tenantId) => {
        if (!tenantId) return;
        console.log(`🏢 Cambiando tenant a: ${tenantId}`);
        guardarTenant(tenantId);
        set({ currentTenant: tenantId });
        // Recargar la página para aplicar cambios en todos los componentes
        window.location.reload();
      },
      
      logout: async (navigate = null) => {
        console.log("🔴 Logout desde store");
        
        try {
          await authService.logout(navigate);
        } catch (error) {
          console.warn('Error en logout API, continuando con logout local:', error);
        } finally {
          // ✅ Limpiar estado local
          set({ user: null, isLoading: false, currentTenant: 'default' });
          
          // ✅ Limpiar localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          localStorage.removeItem('pending_2fa_token');
          
          // ✅ Limpiar tenant
          limpiarTenant();
          
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
            // ✅ Cargar tenant actual
            const currentTenant = obtenerTenantActual();
            set({ user, isLoading: false, currentTenant });
          } else {
            console.log("⚠️ No hay usuario en localStorage");
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("❌ Error inicializando store:", error);
          set({ isLoading: false });
        }
      },
      
      updateUser: (updatedUserData) => {
        console.log("🔄 Actualizando usuario en store:", updatedUserData?.email);
        const currentUser = get().user;
        const mergedUser = { ...currentUser, ...updatedUserData };
        set({ user: mergedUser });
        
        if (mergedUser) {
          localStorage.setItem('user', JSON.stringify(mergedUser));
        }
      },
      
      isAuthenticated: () => {
        const { user } = get();
        return !!user;
      },
      
      getUserRole: () => {
        const { user } = get();
        return user?.rol || null;
      },
      
      // ✅ NUEVO: obtener tenant actual
      getCurrentTenant: () => {
        return get().currentTenant;
      }
    }),
    {
      name: 'auth-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({ 
        user: state.user,
        currentTenant: state.currentTenant  // ✅ NUEVO: persistir tenant
      }),
    }
  )
);

// Sincronización entre pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'user' && !e.newValue) {
      console.log("🔴 Logout detectado en otra pestaña");
      useAuthStore.setState({ user: null, isLoading: false, currentTenant: 'default' });
      setTimeout(() => {
        if (!useAuthStore.getState().user) {
          window.location.href = '/login';
        }
      }, 100);
    }
    
    if (e.key === 'auth-storage' && e.newValue) {
      try {
        const newState = JSON.parse(e.newValue);
        const currentUser = useAuthStore.getState().user;
        const newUser = newState?.state?.user;
        
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