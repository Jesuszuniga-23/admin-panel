import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class DashboardService {
  
  // =====================================================
  // OBTENER DASHBOARD COMPLETO (ÚNICA FUENTE DE VERDAD)
  // =====================================================
  async obtenerDashboardCompleto(options = {}) {
    try {
      const response = await axiosInstance.get(ENDPOINTS.DASHBOARD.COMPLETO, {
        signal: options.signal
      });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(' Petición cancelada en obtenerDashboardCompleto');
        return { success: false, aborted: true };
      }
      console.error('Error obteniendo dashboard completo:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // MÉTODO DE COMPATIBILIDAD (usa el cache)
  // =====================================================
  async obtenerEstadisticas(filtros = {}, options = {}) {
    const response = await this.obtenerDashboardCompleto(options);
    if (response.success && response.data) {
      return {
        success: true,
        personal: response.data.personal,
        unidades: response.data.unidades,
        alertas: response.data.alertas,
        kpis: {
          personal: {
            total: response.data.personal?.total || 0,
            variacion: '0%',
            tendencia: 'stable'
          },
          unidades: {
            total: response.data.unidades?.total || 0,
            variacion: '0%',
            tendencia: 'stable'
          },
          alertas: {
            total: response.data.alertas?.totalAlertas || 0,
            variacion: '0%',
            tendencia: 'stable'
          }
        }
      };
    }
    return { success: false, error: response.error };
  }

  // =====================================================
  // OBTENER ALERTAS POR HORA
  // =====================================================
  async obtenerAlertasPorHora(filtros = {}, options = {}) {
    const response = await this.obtenerDashboardCompleto(options);
    if (response.success && response.data) {
      return response.data.alertasPorHora || [];
    }
    return [];
  }

  // =====================================================
  // OBTENER ACTIVIDAD RECIENTE
  // =====================================================
  async obtenerActividadReciente(filtros = {}, options = {}) {
    const response = await this.obtenerDashboardCompleto(options);
    if (response.success && response.data) {
      return response.data.actividadReciente || { personal: [], unidades: [], alertas: [] };
    }
    return { personal: [], unidades: [], alertas: [] };
  }
}

export default new DashboardService();