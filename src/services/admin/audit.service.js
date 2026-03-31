// src/services/admin/audit.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AuditService {
  
  // Obtener logs con filtros y paginación
  async obtenerLogs(params = {}) {
    try {
      const { page = 1, limit = 20, fecha_desde, fecha_hasta, usuario_email, accion, severidad, signal } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (fecha_desde) queryParams.append('fecha_desde', fecha_desde);
      if (fecha_hasta) queryParams.append('fecha_hasta', fecha_hasta);
      if (usuario_email) queryParams.append('usuario_email', usuario_email);
      if (accion) queryParams.append('accion', accion);
      if (severidad) queryParams.append('severidad', severidad);
      
      const config = signal ? { signal } : {};
      const response = await axiosInstance.get(`${ENDPOINTS.AUDIT.LOGS}?${queryParams.toString()}`, config);
      return response.data;
      
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo logs:', error);
      throw error.response?.data || { error: 'Error al obtener logs' };
    }
  }
  
  // Obtener detalle de un log
  async obtenerDetalle(id) {
    try {
      const response = await axiosInstance.get(ENDPOINTS.AUDIT.DETALLE(id));
      return response.data;
    } catch (error) {
      console.error('Error obteniendo detalle:', error);
      throw error.response?.data || { error: 'Error al obtener detalle' };
    }
  }
}

export default new AuditService();