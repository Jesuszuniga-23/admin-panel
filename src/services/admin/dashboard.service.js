import axiosInstance from '../api/axiosConfig';
import personalService from './personal.service';
import unidadService from './unidad.service';
import alertasService from './alertas.service';

class DashboardService {
  
  // OBTENER TODAS LAS ESTADÍSTICAS DEL DASHBOARD
  async obtenerEstadisticas() {
    try {
      console.log("📊 Cargando estadísticas del dashboard...");
      
      // Obtener datos en paralelo
      const [
        personalRes,
        unidadesRes,
        alertasExpiradasRes,
        alertasCerradasRes
      ] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 1000 }),
        unidadService.listarUnidades({ limite: 1000 }),
        alertasService.obtenerExpiradas({ limite: 1000 }),
        alertasService.obtenerCerradasManual({ limite: 1000 })
      ]);

      // Procesar personal
      const personalData = personalRes.status === 'fulfilled' ? personalRes.value.data || [] : [];
      
      // Procesar unidades
      const unidadesData = unidadesRes.status === 'fulfilled' ? unidadesRes.value.data || [] : [];
      
      // Procesar alertas expiradas
      const alertasExpiradas = alertasExpiradasRes.status === 'fulfilled' ? alertasExpiradasRes.value.data || [] : [];
      
      // Procesar alertas cerradas manualmente
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

      // Calcular estadísticas de alertas
      const alertasStats = {
        expiradas: alertasExpiradas.length,
        cerradasManual: alertasCerradas.length,
        totalAlertas: alertasExpiradas.length + alertasCerradas.length
      };

      // Calcular KPIs con variación (simulada por ahora)
      const kpis = {
        personal: {
          total: personalStats.total,
          variacion: '+5%',
          tendencia: 'up'
        },
        unidades: {
          total: unidadesStats.total,
          variacion: '+2%',
          tendencia: 'up'
        },
        alertas: {
          total: alertasStats.totalAlertas,
          variacion: '-3%',
          tendencia: 'down'
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

//obtener alertas estancadas durante 24 horas
  async obtenerAlertasPorHora() {
    try {
      // Obtener alertas expiradas y cerradas
      const [expiradasRes, cerradasRes] = await Promise.allSettled([
        alertasService.obtenerExpiradas({ limite: 500 }),
        alertasService.obtenerCerradasManual({ limite: 500 })
      ]);

      const expiradas = expiradasRes.status === 'fulfilled' ? expiradasRes.value.data || [] : [];
      const cerradas = cerradasRes.status === 'fulfilled' ? cerradasRes.value.data || [] : [];
      
      // Combinar todas las alertas
      const todasAlertas = [...expiradas, ...cerradas];
      
      // Crear array para 24 horas
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: i,
        expiradas: 0,
        cerradas: 0,
        total: 0
      }));

      // Agrupar por hora
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

  // =====================================================
  // OBTENER ACTIVIDAD RECIENTE
  
  async obtenerActividadReciente() {
    try {
      const [personalRes, unidadesRes, alertasRes] = await Promise.allSettled([
        personalService.listarPersonal({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en' }),
        unidadService.listarUnidades({ limite: 5, orden: 'DESC', ordenarPor: 'creado_en' }),
        alertasService.obtenerExpiradas({ limite: 5 })
      ]);

      const personalReciente = personalRes.status === 'fulfilled' ? personalRes.value.data || [] : [];
      const unidadesRecientes = unidadesRes.status === 'fulfilled' ? unidadesRes.value.data || [] : [];
      const alertasRecientes = alertasRes.status === 'fulfilled' ? alertasRes.value.data || [] : [];

      return {
        personal: personalReciente,
        unidades: unidadesRecientes,
        alertas: alertasRecientes
      };

    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      return { personal: [], unidades: [], alertas: [] };
    }
  }
}

export default new DashboardService();