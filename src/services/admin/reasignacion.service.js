// src/services/admin/reasignacion.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class ReasignacionService {
  
  // OBTENER ALERTAS PENDIENTES DE REASIGNACIÓN >5 min
  async obtenerPendientes(filtros = {}) {
    try {
      console.log(" Obteniendo alertas pendientes de reasignación...");
      
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo); // 🔥 NUEVO: filtrar por tipo
      
      const url = `${ENDPOINTS.REASIGNACIONES.PENDIENTES}?${params.toString()}`;
      const response = await axiosInstance.get(url);
      
      console.log(" Respuesta pendientes:", response.data);
      return response.data;
      
    } catch (error) {
      console.error(' Error obteniendo pendientes:', error);
      throw error.response?.data || { error: 'Error al obtener alertas pendientes' };
    }
  }

  // OBTENER UNIDADES DISPONIBLES PARA UNA ALERTA
  async obtenerUnidadesDisponibles(alertaId) {
    try {
      console.log(` Obteniendo unidades disponibles para alerta ${alertaId}...`);
      
      const response = await axiosInstance.get(ENDPOINTS.REASIGNACIONES.UNIDADES_DISPONIBLES(alertaId));
      
      console.log(" Unidades disponibles:", response.data);
      return response.data;
      
    } catch (error) {
      console.error(' Error obteniendo unidades:', error);
      throw error.response?.data || { error: 'Error al obtener unidades disponibles' };
    }
  }

  // REASIGNAR ALERTA A OTRA UNIDAD
  async reasignarAlerta(alertaId, unidadId, motivo = '') {
    try {
      console.log(` Reasignando alerta ${alertaId} a unidad ${unidadId}...`);
      
      const response = await axiosInstance.post(
        ENDPOINTS.REASIGNACIONES.REASIGNAR(alertaId),
        { 
          unidad_id: unidadId,
          motivo 
        }
      );
      
      console.log("Alerta reasignada:", response.data);
      return response.data;
      
    } catch (error) {
      console.error(' Error reasignando alerta:', error);
      throw error.response?.data || { error: 'Error al reasignar alerta' };
    }
  }
}

export default new ReasignacionService();