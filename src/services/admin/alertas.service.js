// src/services/admin/alertas.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AlertasService {
  // Obtener alertas expiradas
  async obtenerExpiradas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.tipo) params.append('tipo', filtros.tipo); // 🔥 NUEVO: filtrar por tipo
      
      const url = `${ENDPOINTS.ALERTAS.EXPIRADAS}?${params.toString()}`;
      console.log(" Llamando a alertas expiradas:", url);
      
      const response = await axiosInstance.get(url);
      console.log("Respuesta alertas:", response.data);
      
      return response.data;
    } catch (error) {
      console.error(" Error cargando alertas:", error);
      return { data: [] };
    }
  }

  // Obtener alertas cerradas manualmente
  async obtenerCerradasManual(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.admin_id) params.append('admin_id', filtros.admin_id);
      if (filtros.tipo) params.append('tipo', filtros.tipo); // 🔥 NUEVO: filtrar por tipo
      
      const url = `${ENDPOINTS.ALERTAS.CERRADAS_MANUAL}?${params.toString()}`;
      console.log(" Llamando a alertas cerradas manual:", url);
      
      const response = await axiosInstance.get(url);
      console.log("Respuesta alertas cerradas:", response.data);
      
      return response.data;
    } catch (error) {
      console.error(" Error cargando alertas cerradas:", error);
      return { 
        data: [], 
        total: 0,
        paginacion: { total: 0, pagina: 1, limite: 10, total_paginas: 0 } 
      };
    }
  }

  // Obtener estadísticas de alertas no atendidas
  async obtenerEstadisticas(year, tipo = null) {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (tipo) params.append('tipo', tipo); // 🔥 NUEVO: filtrar por tipo
      
      const url = `${ENDPOINTS.ALERTAS.ESTADISTICAS}?${params.toString()}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error(" Error cargando estadísticas:", error);
      return { estadisticas: [] };
    }
  }
  
  async cerrarManual(alertaId, motivo) {
    try {
      console.log(` Cerrando manualmente alerta ${alertaId} con motivo:`, motivo);
      
      const response = await axiosInstance.post(
        ENDPOINTS.ALERTAS.CERRAR_INDIVIDUAL(alertaId),
        { motivo }
      );
      
      console.log(" Respuesta cierre manual:", response.data);
      return response.data;
      
    } catch (error) {
      console.error(' Error cerrando alerta manual:', error);
      throw error.response?.data || { error: 'Error al cerrar alerta' };
    }
  }
  
  async obtenerDetalle(alertaId) {
    try {
      const expiradas = await this.obtenerExpiradas({ limite: 100 });
      const cerradas = await this.obtenerCerradasManual({ limite: 100 });
      
      const todas = [...expiradas.data, ...cerradas.data];
      return todas.find(a => a.id === parseInt(alertaId));
      
    } catch (error) {
      console.error('Error obteniendo detalle de alerta:', error);
      return null;
    }
  }
  
  async obtenerParaReportes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.zona) params.append('zona', filtros.zona);
      if (filtros.limite) params.append('limite', filtros.limite || 1000);
      
      const url = `${BASE_URL}/admin/reportes/alertas?${params.toString()}`;
      console.log('📡 Obteniendo alertas para reportes:', url);
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo alertas para reportes:', error);
      return { data: [], total: 0 };
    }
  }
  
  // OBTENER TODAS LAS ALERTAS PARA ANÁLISIS GEOGRÁFICO
  async obtenerAlertasGeograficas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.limite) params.append('limite', filtros.limite || 1000);
      
      // Obtener alertas de todas las fuentes
      const [activas, proceso, cerradas, expiradas] = await Promise.all([
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.ACTIVAS}?${params.toString()}`).catch(() => ({ data: { data: [] } })),
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.EN_PROCESO}?${params.toString()}`).catch(() => ({ data: { data: [] } })),
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.CERRADAS}?${params.toString()}`).catch(() => ({ data: { data: [] } })),
        axiosInstance.get(`${ENDPOINTS.ALERTAS.EXPIRADAS}?${params.toString()}`).catch(() => ({ data: { data: [] } }))
      ]);

      // Combinar todas las alertas
      const todasAlertas = [
        ...(activas.data?.data || []),
        ...(proceso.data?.data || []),
        ...(cerradas.data?.data || []),
        ...(expiradas.data?.data || [])
      ];

      console.log(`📍 ${todasAlertas.length} alertas cargadas para análisis geográfico`);
      return { data: todasAlertas, total: todasAlertas.length };

    } catch (error) {
      console.error('Error obteniendo alertas geográficas:', error);
      return { data: [], total: 0 };
    }
  }
}

export default new AlertasService();