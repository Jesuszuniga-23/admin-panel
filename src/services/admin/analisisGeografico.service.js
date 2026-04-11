// src/services/admin/analisisGeografico.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AnalisisGeograficoService {
    
    // =====================================================
    // OBTENER DATOS COMPLETOS PARA ANÁLISIS GEOGRÁFICO
    // =====================================================
    async obtenerDatosCompletos(params = {}) {
        const config = {};
        if (params.signal) {
            config.signal = params.signal;
            delete params.signal;
        }
        
        try {
            // ✅ CORREGIDO: COMPLETO en lugar de DATOS
            const response = await axiosInstance.get(ENDPOINTS.ANALISIS_GEOGRAFICO.COMPLETO, { params, ...config });
            return response.data;
        } catch (error) {
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                throw error;
            }
            console.error('Error obteniendo datos geográficos:', error);
            throw error;
        }
    }
    
    // =====================================================
    // OBTENER GEOCERCA DEL TENANT ACTUAL
    // =====================================================
    async obtenerGeocercaTenant() {
        try {
            const response = await axiosInstance.get('/admin/tenants/mi-geocerca');
            return response.data;
        } catch (error) {
            console.error('Error obteniendo geocerca:', error);
            return { success: false, data: null };
        }
    }
}

export default new AnalisisGeograficoService();