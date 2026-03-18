import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class RecuperacionService {
  // Obtener solicitudes de recuperación pendientes
  async obtenerPendientes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      
      const url = `${ENDPOINTS.RECUPERACIONES.PENDIENTES}?${params.toString()}`;
      console.log("Llamando a recuperaciones pendientes:", url);
      
      const response = await axiosInstance.get(url);
      console.log(" Respuesta recuperaciones:", response.data);
      
      return response.data;
    } catch (error) {
      console.error(" Error cargando recuperaciones:", error);
      return { data: [], total: 0 };
    }
  }

  // Aprobar solicitud de recuperación
  async aprobarSolicitud(id) {
    try {
      const response = await axiosInstance.post(ENDPOINTS.RECUPERACIONES.APROBAR(id));
      return response.data;
    } catch (error) {
      console.error(" Error aprobando solicitud:", error);
      throw error;
    }
  }

  // Rechazar solicitud de recuperación
  async rechazarSolicitud(id, motivo) {
    try {
      const response = await axiosInstance.post(ENDPOINTS.RECUPERACIONES.RECHAZAR(id), { motivo });
      return response.data;
    } catch (error) {
      console.error(" Error rechazando solicitud:", error);
      throw error;
    }
  }
}

export default new RecuperacionService();