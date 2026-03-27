// src/services/admin/alertasPanel.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AlertasPanelService {
  // =====================================================
  // LISTAR ALERTAS ACTIVAS
  // =====================================================
  async listarActivas(params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.ACTIVAS, { params, ...config });
      return response.data;
    } catch (error) {
      // ✅ Propagar errores de cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      // ✅ Para otros errores, loguear y relanzar
      console.error('Error en listarActivas:', error);
      throw error;
    }
  }

  // =====================================================
  // LISTAR ALERTAS EN PROCESO
  // =====================================================
  async listarEnProceso(params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.EN_PROCESO, { params, ...config });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error en listarEnProceso:', error);
      throw error;
    }
  }

  // =====================================================
  // LISTAR ALERTAS CERRADAS
  // =====================================================
  async listarCerradas(params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.CERRADAS, { params, ...config });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error en listarCerradas:', error);
      throw error;
    }
  }

  // =====================================================
  // OBTENER DETALLE DE ALERTA (CON OFUSCACIÓN)
  // =====================================================
  async obtenerDetalle(id, params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.DETALLE(id), { params, ...config });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error en obtenerDetalle:', error);
      throw error;
    }
  }

  // =====================================================
  // SOLICITAR OTP PARA VER DETALLES COMPLETOS
  // =====================================================
  async solicitarOtp(id, params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.SOLICITAR_OTP(id), {}, { params, ...config });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error en solicitarOtp:', error);
      throw error;
    }
  }

  // =====================================================
  // VERIFICAR OTP Y OBTENER DETALLES COMPLETOS
  // =====================================================
  async verificarOtp(id, codigo, params = {}) {
    const config = {};
    if (params.signal) {
      config.signal = params.signal;
      delete params.signal;
    }
    
    try {
      const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.VERIFICAR_OTP(id), { codigo }, { params, ...config });
      return response.data;
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }
      console.error('Error en verificarOtp:', error);
      throw error;
    }
  }

  // =====================================================
  // ALIAS PARA COMPATIBILIDAD CON DASHBOARD.SERVICE.JS
  // =====================================================
  async obtenerActivas(params = {}) {
    return this.listarActivas(params);
  }

  async obtenerEnProceso(params = {}) {
    return this.listarEnProceso(params);
  }

  async obtenerCerradas(params = {}) {
    return this.listarCerradas(params);
  }
}

export default new AlertasPanelService();