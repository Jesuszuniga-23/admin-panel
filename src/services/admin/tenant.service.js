// src/services/admin/tenant.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class TenantService {
    
    // Listar todos los tenants
    async listarTenants(filtros = {}) {
        try {
            const response = await axiosInstance.get(ENDPOINTS.TENANTS.LIST);
            return response.data;
        } catch (error) {
            console.error('Error listando tenants:', error);
            throw error.response?.data || { error: 'Error al listar municipios' };
        }
    }

    // Obtener tenant por ID
    async obtenerTenant(id, filtros = {}) {
        try {
            const response = await axiosInstance.get(ENDPOINTS.TENANTS.GET(id));
            return response.data;
        } catch (error) {
            console.error('Error obteniendo tenant:', error);
            throw error.response?.data || { error: 'Error al obtener municipio' };
        }
    }

    // Crear tenant
    async crearTenant(data, filtros = {}) {
        try {
            const response = await axiosInstance.post(ENDPOINTS.TENANTS.CREATE, data);
            return response.data;
        } catch (error) {
            console.error('Error creando tenant:', error);
            throw error.response?.data || { error: 'Error al crear municipio' };
        }
    }

    // Actualizar tenant
    async actualizarTenant(id, data, filtros = {}) {
        try {
            const response = await axiosInstance.put(ENDPOINTS.TENANTS.UPDATE(id), data);
            return response.data;
        } catch (error) {
            console.error('Error actualizando tenant:', error);
            throw error.response?.data || { error: 'Error al actualizar municipio' };
        }
    }

    // Activar/Desactivar tenant
    async toggleTenant(id, activo, filtros = {}) {
        try {
            const response = await axiosInstance.patch(ENDPOINTS.TENANTS.TOGGLE(id), { activo });
            return response.data;
        } catch (error) {
            console.error('Error toggling tenant:', error);
            throw error.response?.data || { error: 'Error al cambiar estado' };
        }
    }

    // Marcar como pagado
    async marcarComoPagado(id, periodo, monto, filtros = {}) {
        try {
            const response = await axiosInstance.patch(ENDPOINTS.TENANTS.MARK_PAID(id), { periodo, monto });
            return response.data;
        } catch (error) {
            console.error('Error marcando como pagado:', error);
            throw error.response?.data || { error: 'Error al registrar pago' };
        }
    }

    // Suspender tenant
    async suspenderTenant(id, motivo = '', filtros = {}) {
        try {
            const response = await axiosInstance.patch(ENDPOINTS.TENANTS.SUSPEND(id), { motivo });
            return response.data;
        } catch (error) {
            console.error('Error suspendiendo tenant:', error);
            throw error.response?.data || { error: 'Error al suspender municipio' };
        }
    }

    // Reactivar tenant
    async reactivarTenant(id, filtros = {}) {
        try {
            const response = await axiosInstance.patch(ENDPOINTS.TENANTS.REACTIVATE(id));
            return response.data;
        } catch (error) {
            console.error('Error reactivando tenant:', error);
            throw error.response?.data || { error: 'Error al reactivar municipio' };
        }
    }

    // Obtener estadísticas
    async obtenerEstadisticas(id, filtros = {}) {
        try {
            const response = await axiosInstance.get(ENDPOINTS.TENANTS.STATS(id));
            return response.data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error.response?.data || { error: 'Error al obtener estadísticas' };
        }
    }

    // Crear administrador municipal
    async crearAdministradorMunicipal(tenantId, data, filtros = {}) {
        try {
            const response = await axiosInstance.post(ENDPOINTS.TENANTS.CREATE_ADMIN(tenantId), data);
            return response.data;
        } catch (error) {
            console.error('Error creando administrador:', error);
            throw error.response?.data || { error: 'Error al crear administrador' };
        }
    }
}

export default new TenantService();