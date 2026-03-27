// src/services/admin/analisisGeografico.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AnalisisGeograficoService {
    async obtenerDatosCompletos(filtros = {}) {
        try {
            const params = new URLSearchParams();
            if (filtros.desde) params.append('desde', filtros.desde);
            if (filtros.hasta) params.append('hasta', filtros.hasta);
            if (filtros.tipo && filtros.tipo !== 'todos') params.append('tipo', filtros.tipo);
            if (filtros.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
            if (filtros.zona && filtros.zona !== 'todas') params.append('zona', filtros.zona);
            if (filtros.limite) params.append('limite', filtros.limite);
            
            const config = {};
            if (filtros.signal) {
                config.signal = filtros.signal;
            }
            
            const url = `${ENDPOINTS.ANALISIS_GEOGRAFICO.COMPLETO}?${params.toString()}`;
            const response = await axiosInstance.get(url, config);
            return response.data;
        } catch (error) {
            if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                throw error;
            }
            console.error('Error obteniendo datos geográficos:', error);
            return { success: false, error: error.message, alertas: [], estadisticas: {}, datosPorZona: [], tendencias: [] };
        }
    }
}

export default new AnalisisGeograficoService();