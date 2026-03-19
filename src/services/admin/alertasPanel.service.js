import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AlertasPanelService {
  
  // OBTENER ALERTAS ACTIVAS (SIN ASIGNAR)
  async obtenerActivas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      
      const url = `${ENDPOINTS.ALERTAS_PANEL.ACTIVAS}?${params.toString()}`;
      console.log(' Obteniendo alertas activas:', url);
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo alertas activas:', error);
      return { data: [], total: 0, pagina: 1, total_paginas: 0 };
    }
  }

  // OBTENER ALERTAS EN PROCESO (ASIGNADAS/ATENDIENDO)
  
  async obtenerEnProceso(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);
      
      const url = `${ENDPOINTS.ALERTAS_PANEL.EN_PROCESO}?${params.toString()}`;
      console.log(' Obteniendo alertas en proceso:', url);
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo alertas en proceso:', error);
      return { data: [], total: 0, pagina: 1, total_paginas: 0 };
    }
  }

  // OBTENER ALERTAS CERRADAS (CON REPORTES)
  
  async obtenerCerradas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      
      const url = `${ENDPOINTS.ALERTAS_PANEL.CERRADAS}?${params.toString()}`;
      console.log(' Obteniendo alertas cerradas:', url);
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo alertas cerradas:', error);
      return { data: [], total: 0, pagina: 1, total_paginas: 0 };
    }
  }

  // OBTENER DETALLE DE ALERTA
  async obtenerDetalle(id) {
    try {
      console.log(` Obteniendo detalle de alerta ${id}`);
      const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.DETALLE(id));
      return response.data;
    } catch (error) {
      console.error(' Error obteniendo detalle:', error);
      return { success: false, data: null };
    }
  }
  
}

export default new AlertasPanelService();