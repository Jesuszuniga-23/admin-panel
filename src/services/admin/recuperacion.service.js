// src/services/admin/recuperacion.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class RecuperacionService {
  // Obtener solicitudes de recuperación pendientes
  async obtenerPendientes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.estado) params.append('estado', filtros.estado);
      
      const url = `${ENDPOINTS.RECUPERACIONES.PENDIENTES}?${params.toString()}`;
      console.log("📞 Llamando a recuperaciones pendientes:", url);
      
      // ✅ Configurar la petición con signal si existe
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      console.log("📦 Respuesta recuperaciones:", response.data);
      
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación (tanto AbortError como ERR_CANCELED)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en obtenerPendientes');
        throw error;
      }
      console.error("❌ Error cargando recuperaciones:", error);
      return { data: [], total: 0 };
    }
  }

  // Aprobar solicitud de recuperación
  async aprobarSolicitud(id, filtros = {}) {
    try {
      // ✅ Configurar la petición con signal si existe
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.RECUPERACIONES.APROBAR(id), {}, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en aprobarSolicitud');
        throw error;
      }
      console.error("❌ Error aprobando solicitud:", error);
      throw error;
    }
  }

  // Rechazar solicitud de recuperación
  async rechazarSolicitud(id, motivo, filtros = {}) {
    try {
      // ✅ Configurar la petición con signal si existe
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(
        ENDPOINTS.RECUPERACIONES.RECHAZAR(id), 
        { motivo }, 
        config
      );
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en rechazarSolicitud');
        throw error;
      }
      console.error("❌ Error rechazando solicitud:", error);
      throw error;
    }
  }
}

export default new RecuperacionService();