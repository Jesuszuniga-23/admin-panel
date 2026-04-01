import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class UnidadService {
  async listarUnidades(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.activa !== undefined) params.append('activa', filtros.activa);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);

      const url = `${ENDPOINTS.UNIDADES.LIST}?${params.toString()}`;
      console.log("📡 Listando unidades:", url);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error listando unidades:', error);
      throw error.response?.data || { error: 'Error al listar unidades' };
    }
  }

  async obtenerUnidad(id, filtros = {}) {
    try {
      const url = ENDPOINTS.UNIDADES.GET(id);
      console.log("🔍 Obteniendo unidad:", url);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo unidad:', error);
      throw error.response?.data || { error: 'Error al obtener unidad' };
    }
  }

  async crearUnidad(datos, filtros = {}) {
    try {
      console.log("📝 Creando unidad:", datos);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.CREATE, datos, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error creando unidad:', error);
      throw error.response?.data || { error: 'Error al crear unidad' };
    }
  }

  async actualizarUnidad(id, datos, filtros = {}) {
    try {
      console.log("📡 Actualizando unidad:", id, datos);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.put(ENDPOINTS.UNIDADES.UPDATE(id), datos, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error actualizando unidad:', error);
      throw error.response?.data || { error: 'Error al actualizar unidad' };
    }
  }

  async eliminarUnidad(id, filtros = {}) {
    try {
      console.log("🗑️ Eliminando unidad:", id);
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.delete(ENDPOINTS.UNIDADES.DELETE(id), config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error eliminando unidad:', error);
      throw error.response?.data || { error: 'Error al eliminar unidad' };
    }
  }

  async toggleActiva(id, activa, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.patch(ENDPOINTS.UNIDADES.TOGGLE_ACTIVA(id), { activa }, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error cambiando estado:', error);
      throw error.response?.data || { error: 'Error al cambiar estado' };
    }
  }

  async restaurarUnidad(id, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.RESTAURAR(id), {}, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error restaurando unidad:', error);
      throw error.response?.data || { error: 'Error al restaurar unidad' };
    }
  }

  async asignarPersonal(unidadId, personalId, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.ASIGNAR(unidadId), { personal_id: personalId }, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error asignando personal:', error);
      throw error.response?.data || { error: 'Error al asignar personal' };
    }
  }

  async removerPersonal(unidadId, personalId, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.REMOVER(unidadId), { personal_id: personalId }, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error removiendo personal:', error);
      throw error.response?.data || { error: 'Error al remover personal' };
    }
  }

  async personalDisponible(unidadId, tipo, filtros = {}) {
    try {
      const url = tipo
        ? `${ENDPOINTS.UNIDADES.PERSONAL_DISPONIBLE(unidadId)}?tipo=${tipo}`
        : ENDPOINTS.UNIDADES.PERSONAL_DISPONIBLE(unidadId);

      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo personal disponible:', error);
      throw error.response?.data || { error: 'Error al obtener personal disponible' };
    }
  }
}

export default new UnidadService();