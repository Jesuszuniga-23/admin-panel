import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AlertasService {
  // Obtener alertas expiradas
  async obtenerExpiradas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      
      const url = `${ENDPOINTS.ALERTAS.EXPIRADAS}?${params.toString()}`;
      console.log("📡 Llamando a alertas expiradas:", url);
      
      const response = await axiosInstance.get(url);
      console.log("✅ Respuesta alertas:", response.data);
      
      return response.data;
    } catch (error) {
      console.error("❌ Error cargando alertas:", error);
      return { data: [] };
    }
  }

  // Obtener alertas cerradas manualmente
  // Obtener alertas cerradas manualmente
async obtenerCerradasManual(filtros = {}) {
  try {
    const params = new URLSearchParams();
    if (filtros.limite) params.append('limite', filtros.limite);
    if (filtros.pagina) params.append('pagina', filtros.pagina);
    if (filtros.admin_id) params.append('admin_id', filtros.admin_id);
    
    const url = `${ENDPOINTS.ALERTAS.CERRADAS_MANUAL}?${params.toString()}`;
    console.log("📡 Llamando a alertas cerradas manual:", url);
    
    const response = await axiosInstance.get(url);
    console.log("✅ Respuesta alertas cerradas:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("❌ Error cargando alertas cerradas:", error);
    return { 
      data: [], 
      total: 0,
      paginacion: { total: 0, pagina: 1, limite: 10, total_paginas: 0 } 
    };
  }
}

  // Obtener estadísticas de alertas no atendidas
  async obtenerEstadisticas(year) {
    try {
      const url = year 
        ? `${ENDPOINTS.ALERTAS.ESTADISTICAS}?year=${year}`
        : ENDPOINTS.ALERTAS.ESTADISTICAS;
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
      return { estadisticas: [] };
    }
  }
   async cerrarManual(alertaId, motivo) {
    try {
      console.log(`📡 Cerrando manualmente alerta ${alertaId} con motivo:`, motivo);
      
      const response = await axiosInstance.post(
        ENDPOINTS.ALERTAS.CERRAR_INDIVIDUAL(alertaId),
        { motivo }
      );
      
      console.log("✅ Respuesta cierre manual:", response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error cerrando alerta manual:', error);
      throw error.response?.data || { error: 'Error al cerrar alerta' };
    }
  }
 async obtenerDetalle(alertaId) {
    try {
      // Como no tenemos un endpoint específico de detalle,
      // usamos expiradas o cerradas con filtro por ID
      const expiradas = await this.obtenerExpiradas({ limite: 100 });
      const cerradas = await this.obtenerCerradasManual({ limite: 100 });
      
      const todas = [...expiradas.data, ...cerradas.data];
      return todas.find(a => a.id === parseInt(alertaId));
      
    } catch (error) {
      console.error('Error obteniendo detalle de alerta:', error);
      return null;
    }
  }
}

export default new AlertasService();