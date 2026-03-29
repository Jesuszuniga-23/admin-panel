import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class ReasignacionService {
  
  async obtenerPendientes(filtros = {}) {
    try {
      console.log("📡 Obteniendo alertas pendientes de reasignación...");
      
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      
      const url = `${ENDPOINTS.REASIGNACIONES.PENDIENTES}?${params.toString()}`;
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      console.log("📦 Respuesta pendientes:", response.data);
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en obtenerPendientes');
        throw error;
      }
      console.error('❌ Error obteniendo pendientes:', error);
      throw error.response?.data || { error: 'Error al obtener alertas pendientes' };
    }
  }

  async obtenerUnidadesDisponibles(alertaId, filtros = {}) {
    try {
      console.log(`🔍 Obteniendo unidades disponibles para alerta ${alertaId}...`);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(ENDPOINTS.REASIGNACIONES.UNIDADES_DISPONIBLES(alertaId), config);
      
      console.log("🚛 Unidades disponibles:", response.data);
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en obtenerUnidadesDisponibles');
        throw error;
      }
      console.error('❌ Error obteniendo unidades:', error);
      throw error.response?.data || { error: 'Error al obtener unidades disponibles' };
    }
  }

  async reasignarAlerta(alertaId, unidadId, motivo = '', filtros = {}) {
    try {
      console.log(`🔄 Reasignando alerta ${alertaId} a unidad ${unidadId}...`);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(
        ENDPOINTS.REASIGNACIONES.REASIGNAR(alertaId),
        { 
          unidad_id: unidadId,
          motivo 
        },
        config
      );
      
      console.log("✅ Alerta reasignada:", response.data);
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Petición cancelada en reasignarAlerta');
        throw error;
      }
      console.error('❌ Error reasignando alerta:', error);
      throw error.response?.data || { error: 'Error al reasignar alerta' };
    }
  }
}

export default new ReasignacionService();