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
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      
      const url = `${ENDPOINTS.ALERTAS.EXPIRADAS}?${params.toString()}`;
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación (tanto AbortError como ERR_CANCELED)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error cargando alertas expiradas:", error);
      return { data: [], total: 0 };
    }
  }

  // Obtener alertas cerradas manualmente
  async obtenerCerradasManual(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.admin_id) params.append('admin_id', filtros.admin_id);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      
      const url = `${ENDPOINTS.ALERTAS.CERRADAS_MANUAL}?${params.toString()}`;
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error cargando alertas cerradas manual:", error);
      return { data: [], total: 0 };
    }
  }

  // Obtener estadísticas de alertas no atendidas
  async obtenerEstadisticas(year, tipo = null, filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (tipo) params.append('tipo', tipo);
      
      const url = `${ENDPOINTS.ALERTAS.ESTADISTICAS}?${params.toString()}`;
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error("Error cargando estadísticas:", error);
      return { estadisticas: [] };
    }
  }
  
  // Cerrar alerta manualmente
  async cerrarManual(alertaId, motivo, filtros = {}) {
    try {
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.post(
        ENDPOINTS.ALERTAS.CERRAR_INDIVIDUAL(alertaId),
        { motivo },
        config
      );
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error cerrando alerta manual:', error);
      throw error.response?.data || { error: 'Error al cerrar alerta' };
    }
  }
  
  // Obtener alertas para reportes
  async obtenerParaReportes(filtros = {}) {
    try {
      const params = new URLSearchParams();
      if (filtros.desde) params.append('desde', filtros.desde);
      if (filtros.hasta) params.append('hasta', filtros.hasta);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.limite) params.append('limite', filtros.limite || 1000);
      
      const url = `${ENDPOINTS.ALERTAS_PANEL.CERRADAS}?${params.toString()}`;
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo alertas para reportes:', error);
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
      
      const config = {};
      if (filtros.signal) {
        config.signal = filtros.signal;
      }
      
      // ✅ Manejo correcto de cancelación en cada petición individual
      const [activas, proceso, cerradas, expiradas] = await Promise.all([
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.ACTIVAS}?${params.toString()}`, config).catch(err => {
          // Si es error de cancelación, propagarlo
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            throw err;
          }
          return { data: { data: [] } };
        }),
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.EN_PROCESO}?${params.toString()}`, config).catch(err => {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            throw err;
          }
          return { data: { data: [] } };
        }),
        axiosInstance.get(`${ENDPOINTS.ALERTAS_PANEL.CERRADAS}?${params.toString()}`, config).catch(err => {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            throw err;
          }
          return { data: { data: [] } };
        }),
        axiosInstance.get(`${ENDPOINTS.ALERTAS.EXPIRADAS}?${params.toString()}`, config).catch(err => {
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
            throw err;
          }
          return { data: { data: [] } };
        })
      ]);

      const todasAlertas = [
        ...(activas.data?.data || []),
        ...(proceso.data?.data || []),
        ...(cerradas.data?.data || []),
        ...(expiradas.data?.data || [])
      ];

      console.log(`📍 ${todasAlertas.length} alertas cargadas para análisis geográfico`);
      return { data: todasAlertas, total: todasAlertas.length };
    } catch (error) {
      // ✅ Propagar error de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error obteniendo alertas geográficas:', error);
      return { data: [], total: 0 };
    }
  }
}

export default new AlertasService();