import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class UnidadService {
  // LISTAR UNIDADES
  async listarUnidades(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.activa !== undefined) params.append('activa', filtros.activa);
      if (filtros.search) params.append('search', filtros.search);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);

      const url = `${ENDPOINTS.UNIDADES.LIST}?${params.toString()}`;//OBTIENE LOS RESULTADOS DEL ENDPOINT DE UNIDADES
      console.log(" Listando unidades:", url);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error listando unidades:', error);
      throw error.response?.data || { error: 'Error al listar unidades' };
    }
  }

  // OBTENER UNIDAD POR ID
  async obtenerUnidad(id) {
    try {
      const url = ENDPOINTS.UNIDADES.GET(id);
      console.log("Obteniendo unidad:", url);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo unidad:', error);
      throw error.response?.data || { error: 'Error al obtener unidad' };
    }
  }

  // CREAR UNIDAD
  async crearUnidad(datos) {
    try {
      console.log("Creando unidad:", datos);
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.CREATE, datos);
      return response.data;
    } catch (error) {
      console.error('Error creando unidad:', error);
      throw error.response?.data || { error: 'Error al crear unidad' };
    }
  }

  // ACTUALIZAR UNIDAD
  async actualizarUnidad(id, datos) {
    try {
      console.log("📡 Actualizando unidad:", id, datos);
      const response = await axiosInstance.put(ENDPOINTS.UNIDADES.UPDATE(id), datos);
      return response.data;
    } catch (error) {
      console.error('Error actualizando unidad:', error);
      throw error.response?.data || { error: 'Error al actualizar unidad' };
    }
  }

  // ELIMINAR UNIDAD (SOFT DELETE)
  async eliminarUnidad(id) {
    try {
      console.log("Eliminando unidad:", id);
      const response = await axiosInstance.delete(ENDPOINTS.UNIDADES.DELETE(id));
      return response.data;
    } catch (error) {
      console.error('Error eliminando unidad:', error);
      throw error.response?.data || { error: 'Error al eliminar unidad' };
    }
  }

  // ACTIVAR/DESACTIVAR UNIDAD
  async toggleActiva(id, activa) {
    try {
      const response = await axiosInstance.patch(ENDPOINTS.UNIDADES.TOGGLE_ACTIVA(id), { activa });
      return response.data;  // ← Esto ya incluye { success, message, data: { activa, estado } }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      throw error.response?.data || { error: 'Error al cambiar estado' };
    }
  }

  // RESTAURAR UNIDAD ELIMINADA
  async restaurarUnidad(id) {
    try {
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.RESTAURAR(id));
      return response.data;
    } catch (error) {
      console.error('Error restaurando unidad:', error);
      throw error.response?.data || { error: 'Error al restaurar unidad' };
    }
  }

  // ASIGNAR PERSONAL A UNIDAD
  async asignarPersonal(unidadId, personalId) {
    try {
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.ASIGNAR(unidadId), { personal_id: personalId });
      return response.data;
    } catch (error) {
      console.error('Error asignando personal:', error);
      throw error.response?.data || { error: 'Error al asignar personal' };
    }
  }

  // REMOVER PERSONAL DE UNIDAD
  async removerPersonal(unidadId, personalId) {
    try {
      const response = await axiosInstance.post(ENDPOINTS.UNIDADES.REMOVER(unidadId), { personal_id: personalId });
      return response.data;
    } catch (error) {
      console.error('Error removiendo personal:', error);
      throw error.response?.data || { error: 'Error al remover personal' };
    }
  }

  // OBTENER PERSONAL DISPONIBLE PARA ASIGNAR
  async personalDisponible(unidadId, tipo) {
    try {
      const url = tipo
        ? `${ENDPOINTS.UNIDADES.PERSONAL_DISPONIBLE(unidadId)}?tipo=${tipo}`
        : ENDPOINTS.UNIDADES.PERSONAL_DISPONIBLE(unidadId);

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo personal disponible:', error);
      throw error.response?.data || { error: 'Error al obtener personal disponible' };
    }
  }
}

export default new UnidadService();