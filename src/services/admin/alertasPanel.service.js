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
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.ACTIVAS, { params, ...config });
    return response.data;
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
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.EN_PROCESO, { params, ...config });
    return response.data;
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
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.CERRADAS, { params, ...config });
    return response.data;
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
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.DETALLE(id), { params, ...config });
    return response.data;
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
    const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.SOLICITAR_OTP(id), {}, { params, ...config });
    return response.data;
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
    const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.VERIFICAR_OTP(id), { codigo }, { params, ...config });
    return response.data;
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