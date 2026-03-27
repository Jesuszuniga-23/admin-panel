// src/services/admin/dashboard.service.js
import axiosInstance from '../api/axiosConfig';
import personalService from './personal.service';
import unidadService from './unidad.service';
import alertasService from './alertas.service';
import alertasPanelService from './alertasPanel.service';
import authService from '../../services/auth.service';

class DashboardService {
  
  // ✅ NUEVO: Obtener dashboard completo en UNA sola petición
  async obtenerDashboardCompleto(options = {}) {
    try {
      const response = await axiosInstance.get('/admin/dashboard/completo', {
        signal: options.signal  // Para AbortController
      });
      return response.data;
    } catch (error) {
      // ✅ Manejar cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📡 Petición cancelada en obtenerDashboardCompleto');
        return { success: false, aborted: true };
      }
      console.error('Error obteniendo dashboard completo:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // MÉTODOS EXISTENTES (con soporte para signal)
  // =====================================================
  
  async obtenerEstadisticas(filtros = {}, options = {}) {
    try {
      console.log("Cargando estadísticas del dashboard...");
      
      const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
      const rolPersonalPermitido = authService.getRolPersonalPermitido();
      const tipoUnidadPermitido = rolPersonalPermitido;
      
      const personalParams = rolPersonalPermitido ? { rol: rolPersonalPermitido } : {};
      const alertasParams = tipoAlertaPermitido ? { tipo: tipoAlertaPermitido } : {};
      const unidadParams = tipoUnidadPermitido ? { tipo: tipoUnidadPermitido } : {};
      
      // ✅ Agregar signal a los parámetros
      const signal = options.signal;
      
      const [
        personalRes,
        unidadesRes,
        alertasExpiradasRes,
        alertasCerradasManualRes,
        alertasActivasRes,
        alertasEnProcesoRes,
        alertasCerradasRes
      ] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 1000, ...personalParams, ...filtros, signal }),
        unidadService.listarUnidades({ limite: 1000, ...unidadParams, ...filtros, signal }),
        alertasService.obtenerExpiradas({ limite: 1000, ...alertasParams, ...filtros, signal }),
        alertasService.obtenerCerradasManual({ limite: 1000, ...alertasParams, ...filtros, signal }),
        alertasPanelService.obtenerActivas({ limite: 1000, ...alertasParams, ...filtros, signal }),
        alertasPanelService.obtenerEnProceso({ limite: 1000, ...alertasParams, ...filtros, signal }),
        alertasPanelService.obtenerCerradas({ limite: 1000, ...alertasParams, ...filtros, signal })
      ]);

      const personalData = personalRes.status === 'fulfilled' ? personalRes.value.data || [] : [];
      const unidadesData = unidadesRes.status === 'fulfilled' ? unidadesRes.value.data || [] : [];
      const alertasExpiradas = alertasExpiradasRes.status === 'fulfilled' ? alertasExpiradasRes.value.data || [] : [];
      const alertasCerradasManual = alertasCerradasManualRes.status === 'fulfilled' ? alertasCerradasManualRes.value.data || [] : [];
      const alertasActivas = alertasActivasRes.status === 'fulfilled' ? alertasActivasRes.value.data || [] : [];
      const alertasEnProceso = alertasEnProcesoRes.status === 'fulfilled' ? alertasEnProcesoRes.value.data || [] : [];
      const alertasCerradas = alertasCerradasRes.status === 'fulfilled' ? alertasCerradasRes.value.data || [] : [];

      const personalStats = {
        total: personalData.length,
        activos: personalData.filter(p => p.activo).length,
        inactivos: personalData.filter(p => !p.activo).length,
        disponibles: personalData.filter(p => p.disponible).length,
        noDisponibles: personalData.filter(p => !p.disponible).length,
        porRol: {
          policia: personalData.filter(p => p.rol === 'policia').length,
          ambulancia: personalData.filter(p => p.rol === 'ambulancia').length,
          admin: personalData.filter(p => p.rol === 'admin').length,
          superadmin: personalData.filter(p => p.rol === 'superadmin').length
        }
      };

      const unidadesStats = {
        total: unidadesData.length,
        activas: unidadesData.filter(u => u.activa).length,
        inactivas: unidadesData.filter(u => !u.activa).length,
        disponibles: unidadesData.filter(u => u.estado === 'disponible').length,
        ocupadas: unidadesData.filter(u => u.estado === 'ocupada').length,
        porTipo: {
          policia: unidadesData.filter(u => u.tipo === 'policia').length,
          ambulancia: unidadesData.filter(u => u.tipo === 'ambulancia').length
        }
      };

      const alertasStats = {
        expiradas: alertasExpiradas.length,
        cerradasManual: alertasCerradasManual.length,
        totalAlertas: alertasExpiradas.length + alertasCerradasManual.length,
        activas: alertasActivas.length,
        enProceso: alertasEnProceso.length,
        cerradasTotales: alertasCerradas.length
      };

      const mesActual = new Date().getMonth();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      
      const alertasMesActual = alertasCerradas.filter(a => {
        const fecha = new Date(a.fecha_cierre || a.fecha_creacion);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const alertasMesAnterior = alertasCerradas.filter(a => {
        const fecha = new Date(a.fecha_cierre || a.fecha_creacion);
        return fecha.getMonth() === mesAnterior;
      }).length;

      let alertasVariacion = '0%';
      let alertasTendencia = 'stable';
      
      if (alertasMesAnterior > 0) {
        const diff = ((alertasMesActual - alertasMesAnterior) / alertasMesAnterior) * 100;
        alertasVariacion = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
        alertasTendencia = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      }

      const personalNuevos = personalData.filter(p => {
        const fecha = new Date(p.creado_en);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const personalVariacion = personalNuevos > 0 ? `+${personalNuevos}` : '0';
      const personalTendencia = personalNuevos > 0 ? 'up' : 'stable';

      const unidadesNuevas = unidadesData.filter(u => {
        const fecha = new Date(u.creado_en);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const unidadesVariacion = unidadesNuevas > 0 ? `+${unidadesNuevas}` : '0';
      const unidadesTendencia = unidadesNuevas > 0 ? 'up' : 'stable';

      const kpis = {
        personal: {
          total: personalStats.total,
          variacion: personalVariacion,
          tendencia: personalTendencia
        },
        unidades: {
          total: unidadesStats.total,
          variacion: unidadesVariacion,
          tendencia: unidadesTendencia
        },
        alertas: {
          total: alertasStats.totalAlertas,
          variacion: alertasVariacion,
          tendencia: alertasTendencia
        }
      };

      return {
        success: true,
        personal: personalStats,
        unidades: unidadesStats,
        alertas: alertasStats,
        kpis
      };

    } catch (error) {
      // ✅ Manejar cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📡 Petición cancelada en obtenerEstadisticas');
        return { success: false, aborted: true };
      }
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar estadísticas'
      };
    }
  }

  async obtenerAlertasPorHora(filtros = {}, options = {}) {
    try {
      const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
      const alertasParams = tipoAlertaPermitido ? { tipo: tipoAlertaPermitido } : {};
      
      // ✅ Agregar signal a los parámetros
      const signal = options.signal;
      
      const [expiradasRes, cerradasRes] = await Promise.allSettled([
        alertasService.obtenerExpiradas({ limite: 500, ...alertasParams, ...filtros, signal }),
        alertasService.obtenerCerradasManual({ limite: 500, ...alertasParams, ...filtros, signal })
      ]);

      const expiradas = expiradasRes.status === 'fulfilled' ? expiradasRes.value.data || [] : [];
      const cerradas = cerradasRes.status === 'fulfilled' ? cerradasRes.value.data || [] : [];
      
      const todasAlertas = [...expiradas, ...cerradas];
      
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: i,
        expiradas: 0,
        cerradas: 0,
        total: 0
      }));

      todasAlertas.forEach(alerta => {
        const fecha = new Date(alerta.fecha_creacion || alerta.fecha_cierre);
        const hora = fecha.getHours();
        
        if (alerta.expirada) {
          horas[hora].expiradas++;
        } else if (alerta.cerrada_manualmente) {
          horas[hora].cerradas++;
        }
        horas[hora].total++;
      });

      return horas;

    } catch (error) {
      // ✅ Manejar cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📡 Petición cancelada en obtenerAlertasPorHora');
        return [];
      }
      console.error('Error obteniendo alertas por hora:', error);
      return [];
    }
  }

  async obtenerActividadReciente(filtros = {}, options = {}) {
    try {
      const tipoAlertaPermitido = authService.getTipoAlertaPermitido();
      const rolPersonalPermitido = authService.getRolPersonalPermitido();
      const tipoUnidadPermitido = rolPersonalPermitido;
      
      const personalParams = rolPersonalPermitido ? { rol: rolPersonalPermitido } : {};
      const alertasParams = tipoAlertaPermitido ? { tipo: tipoAlertaPermitido } : {};
      const unidadParams = tipoUnidadPermitido ? { tipo: tipoUnidadPermitido } : {};
      
      // ✅ Agregar signal a los parámetros
      const signal = options.signal;
      
      const [personalRes, unidadesRes, alertasActivasRes, alertasProcesoRes] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en', ...personalParams, ...filtros, signal }),
        unidadService.listarUnidades({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en', ...unidadParams, ...filtros, signal }),
        alertasPanelService.obtenerActivas({ limite: 3, ...alertasParams, ...filtros, signal }),
        alertasPanelService.obtenerEnProceso({ limite: 3, ...alertasParams, ...filtros, signal })
      ]);

      const personalReciente = personalRes.status === 'fulfilled' ? personalRes.value.data || [] : [];
      const unidadesRecientes = unidadesRes.status === 'fulfilled' ? unidadesRes.value.data || [] : [];
      const alertasActivas = alertasActivasRes.status === 'fulfilled' ? alertasActivasRes.value.data || [] : [];
      const alertasProceso = alertasProcesoRes.status === 'fulfilled' ? alertasProcesoRes.value.data || [] : [];

      return {
        personal: personalReciente,
        unidades: unidadesRecientes,
        alertas: [...alertasActivas, ...alertasProceso].slice(0, 5)
      };

    } catch (error) {
      // ✅ Manejar cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('📡 Petición cancelada en obtenerActividadReciente');
        return { personal: [], unidades: [], alertas: [] };
      }
      console.error('Error obteniendo actividad reciente:', error);
      return { personal: [], unidades: [], alertas: [] };
    }
  }
}

export default new DashboardService();