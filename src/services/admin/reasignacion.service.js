import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class ReasignacionService {
  
  // =====================================================
  // OBTENER ALERTAS PENDIENTES DE REASIGNACIÓN (>5 min)
  // GET /api/admin/reasignaciones/pendientes
  // =====================================================
  async obtenerPendientes() {
    try {
      console.log("📡 Obteniendo alertas pendientes de reasignación...");
      
      const response = await axiosInstance.get(ENDPOINTS.REASIGNACIONES.PENDIENTES);
      
      console.log("✅ Respuesta pendientes:", response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo pendientes:', error);
      throw error.response?.data || { error: 'Error al obtener alertas pendientes' };
    }
  }

  // =====================================================
  // OBTENER UNIDADES DISPONIBLES PARA UNA ALERTA
  // GET /api/admin/reasignaciones/:alertaId/disponibles
  // =====================================================
  async obtenerUnidadesDisponibles(alertaId) {
    try {
      console.log(`📡 Obteniendo unidades disponibles para alerta ${alertaId}...`);
      
      const response = await axiosInstance.get(ENDPOINTS.REASIGNACIONES.UNIDADES_DISPONIBLES(alertaId));
      
      console.log("✅ Unidades disponibles:", response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error obteniendo unidades:', error);
      throw error.response?.data || { error: 'Error al obtener unidades disponibles' };
    }
  }

  // =====================================================
  // REASIGNAR ALERTA A OTRA UNIDAD
  // POST /api/admin/reasignaciones/:alertaId
  // =====================================================
  async reasignarAlerta(alertaId, unidadId, motivo = '') {
    try {
      console.log(`📡 Reasignando alerta ${alertaId} a unidad ${unidadId}...`);
      
      const response = await axiosInstance.post(
        ENDPOINTS.REASIGNACIONES.REASIGNAR(alertaId),
        { 
          unidad_id: unidadId,
          motivo 
        }
      );
      
      console.log("✅ Alerta reasignada:", response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error reasignando alerta:', error);
      throw error.response?.data || { error: 'Error al reasignar alerta' };
    }
  }
}

export default new ReasignacionService();