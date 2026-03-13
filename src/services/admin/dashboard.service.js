import axiosInstance from '../api/axiosConfig';
import personalService from './personal.service';
import unidadService from './unidad.service';
import alertasService from './alertas.service';
import alertasPanelService from './alertasPanel.service';

class DashboardService {
  
  // OBTENER TODAS LAS ESTADÍSTICAS DEL DASHBOARD
  async obtenerEstadisticas() {
    try {
      console.log("📊 Cargando estadísticas del dashboard...");
      
      // Obtener datos en paralelo (incluyendo los nuevos endpoints)
      const [
        personalRes,
        unidadesRes,
        alertasExpiradasRes,
        alertasCerradasManualRes,
        // NUEVOS ENDPOINTS
        alertasActivasRes,
        alertasEnProcesoRes,
        alertasCerradasRes
      ] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 1000 }),
        unidadService.listarUnidades({ limite: 1000 }),
        alertasService.obtenerExpiradas({ limite: 1000 }),
        alertasService.obtenerCerradasManual({ limite: 1000 }),
        // NUEVAS LLAMADAS
        alertasPanelService.obtenerActivas({ limite: 1000 }),
        alertasPanelService.obtenerEnProceso({ limite: 1000 }),
        alertasPanelService.obtenerCerradas({ limite: 1000 })
      ]);

      // Procesar personal
      const personalData = personalRes.status === 'fulfilled' ? personalRes.value.data || [] : [];
      
      // Procesar unidades
      const unidadesData = unidadesRes.status === 'fulfilled' ? unidadesRes.value.data || [] : [];
      
      // Procesar alertas expiradas
      const alertasExpiradas = alertasExpiradasRes.status === 'fulfilled' ? alertasExpiradasRes.value.data || [] : [];
      
      // Procesar alertas cerradas manualmente
      const alertasCerradasManual = alertasCerradasManualRes.status === 'fulfilled' ? alertasCerradasManualRes.value.data || [] : [];

      // ===== NUEVOS DATOS =====
      // Procesar alertas activas
      const alertasActivas = alertasActivasRes.status === 'fulfilled' ? alertasActivasRes.value.data || [] : [];
      
      // Procesar alertas en proceso
      const alertasEnProceso = alertasEnProcesoRes.status === 'fulfilled' ? alertasEnProcesoRes.value.data || [] : [];
      
      // Procesar alertas cerradas (totales)
      const alertasCerradas = alertasCerradasRes.status === 'fulfilled' ? alertasCerradasRes.value.data || [] : [];

      // Calcular estadísticas de personal
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

      // Calcular estadísticas de unidades
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

      // Calcular estadísticas de alertas (MEJORADO)
      const alertasStats = {
        expiradas: alertasExpiradas.length,
        cerradasManual: alertasCerradasManual.length,
        totalAlertas: alertasExpiradas.length + alertasCerradasManual.length,
        // NUEVOS CAMPOS
        activas: alertasActivas.length,
        enProceso: alertasEnProceso.length,
        cerradasTotales: alertasCerradas.length
      };

      // ===== CÁLCULO DE KPIs CON DATOS REALES =====
      
      // Obtener datos del período anterior (para calcular variación)
      const mesActual = new Date().getMonth();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      
      // Filtrar alertas del mes actual y anterior
      const alertasMesActual = alertasCerradas.filter(a => {
        const fecha = new Date(a.fecha_cierre || a.fecha_creacion);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const alertasMesAnterior = alertasCerradas.filter(a => {
        const fecha = new Date(a.fecha_cierre || a.fecha_creacion);
        return fecha.getMonth() === mesAnterior;
      }).length;

      // Calcular variación para alertas
      let alertasVariacion = '0%';
      let alertasTendencia = 'stable';
      
      if (alertasMesAnterior > 0) {
        const diff = ((alertasMesActual - alertasMesAnterior) / alertasMesAnterior) * 100;
        alertasVariacion = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
        alertasTendencia = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      }

      // Variación para personal (comparando con mes anterior)
      const personalNuevos = personalData.filter(p => {
        const fecha = new Date(p.creado_en);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const personalVariacion = personalNuevos > 0 ? `+${personalNuevos}` : '0';
      const personalTendencia = personalNuevos > 0 ? 'up' : 'stable';

      // Variación para unidades
      const unidadesNuevas = unidadesData.filter(u => {
        const fecha = new Date(u.creado_en);
        return fecha.getMonth() === mesActual;
      }).length;
      
      const unidadesVariacion = unidadesNuevas > 0 ? `+${unidadesNuevas}` : '0';
      const unidadesTendencia = unidadesNuevas > 0 ? 'up' : 'stable';

      // Calcular KPIs con datos reales
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
      console.error('Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message || 'Error al cargar estadísticas'
      };
    }
  }

  // Obtener alertas por hora (sin cambios)
  async obtenerAlertasPorHora() {
    try {
      const [expiradasRes, cerradasRes] = await Promise.allSettled([
        alertasService.obtenerExpiradas({ limite: 500 }),
        alertasService.obtenerCerradasManual({ limite: 500 })
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
      console.error('Error obteniendo alertas por hora:', error);
      return [];
    }
  }

  // Obtener actividad reciente (MEJORADO)
  async obtenerActividadReciente() {
    try {
      const [personalRes, unidadesRes, alertasActivasRes, alertasProcesoRes] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en' }),
        unidadService.listarUnidades({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en' }),
        alertasPanelService.obtenerActivas({ limite: 3 }),
        alertasPanelService.obtenerEnProceso({ limite: 3 })
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
      console.error('Error obteniendo actividad reciente:', error);
      return { personal: [], unidades: [], alertas: [] };
    }
  }
}

export default new DashboardService();