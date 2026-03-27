// src/services/admin/personal.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class PersonalService {
  // LISTAR PERSONAL
  async listarPersonal(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.rol) params.append('rol', filtros.rol);
      if (filtros.activo !== undefined) params.append('activo', filtros.activo);
      if (filtros.disponible !== undefined) params.append('disponible', filtros.disponible);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.incluirEliminados) {
        params.append('incluirEliminados', 'true');
      }

      const url = `${ENDPOINTS.PERSONAL.LIST}?${params.toString()}`;
      console.log("📡 Listando personal:", url);
      
      // ✅ Configurar la petición con signal si existe
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      console.log("✅ Personal recibido:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación (tanto AbortError como ERR_CANCELED)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error listando personal:', error);
      throw error.response?.data || { error: 'Error al listar personal' };
    }
  }

  // OBTENER PERSONAL POR ID
  async obtenerPersonal(id, filtros = {}) {
    try {
      const url = ENDPOINTS.PERSONAL.GET(id);
      console.log("🔍 Obteniendo personal:", url);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      console.log("✅ Personal obtenido:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo personal:', error);
      throw error.response?.data || { error: 'Error al obtener personal' };
    }
  }

  // CREAR PERSONAL
  async crearPersonal(datos, filtros = {}) {
    try {
      console.log("📝 Creando personal:", datos);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.PERSONAL.CREATE, datos, config);
      console.log("✅ Personal creado:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error creando personal:', error);
      throw error.response?.data || { error: 'Error al crear personal' };
    }
  }

  // ACTUALIZAR PERSONAL
  async actualizarPersonal(id, datos, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.put(ENDPOINTS.PERSONAL.UPDATE(id), datos, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error actualizando personal:', error);
      throw error.response?.data || { error: 'Error al actualizar personal' };
    }
  }

  // ELIMINAR PERSONAL (SOFT DELETE)
  async eliminarPersonal(id, filtros = {}) {
    try {
      console.log("🗑️ Eliminando personal:", id);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.delete(ENDPOINTS.PERSONAL.DELETE(id), config);
      console.log("✅ Personal eliminado:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error eliminando personal:', error);
      throw error.response?.data || { error: 'Error al eliminar personal' };
    }
  }

  // ACTIVAR/DESACTIVAR PERSONAL
  async toggleActivo(id, activo, filtros = {}) {
    try {
      console.log("🔄 Cambiando estado personal:", id, activo);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.patch(ENDPOINTS.PERSONAL.TOGGLE_ACTIVO(id), { activo }, config);
      console.log("✅ Estado cambiado:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error cambiando estado:', error);
      throw error.response?.data || { error: 'Error al cambiar estado' };
    }
  }

  // RESTAURAR PERSONAL ELIMINADO
  async restaurarPersonal(id, filtros = {}) {
    try {
      console.log("♻️ Restaurando personal:", id);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.PERSONAL.RESTAURAR(id), {}, config);
      console.log("✅ Personal restaurado:", response.data);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error restaurando personal:', error);
      throw error.response?.data || { error: 'Error al restaurar personal' };
    }
  }
}

export default new PersonalService();