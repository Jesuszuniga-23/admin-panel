// src/services/admin/alertasPanel.service.js
import axiosInstance from '../api/axiosConfig';
import { ENDPOINTS } from '../api/endpoints';

class AlertasPanelService {
  // =====================================================
  // LISTAR ALERTAS ACTIVAS
  // =====================================================
  async listarActivas(params = {}) {
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.ACTIVAS, { params });
    return response.data;
  }

  // =====================================================
  // LISTAR ALERTAS EN PROCESO
  // =====================================================
  async listarEnProceso(params = {}) {
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.EN_PROCESO, { params });
    return response.data;
  }

  // =====================================================
  // LISTAR ALERTAS CERRADAS
  // =====================================================
  async listarCerradas(params = {}) {
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.CERRADAS, { params });
    return response.data;
  }

  // =====================================================
  // OBTENER DETALLE DE ALERTA (CON OFUSCACIÓN)
  // =====================================================
  async obtenerDetalle(id) {
    const response = await axiosInstance.get(ENDPOINTS.ALERTAS_PANEL.DETALLE(id));
    return response.data;
  }

  // =====================================================
  // SOLICITAR OTP PARA VER DETALLES COMPLETOS
  // =====================================================
  async solicitarOtp(id) {
    const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.SOLICITAR_OTP(id));
    return response.data;
  }

  // =====================================================
  // VERIFICAR OTP Y OBTENER DETALLES COMPLETOS
  // =====================================================
  async verificarOtp(id, codigo) {
    const response = await axiosInstance.post(ENDPOINTS.ALERTAS_PANEL.VERIFICAR_OTP(id), { codigo });
    return response.data;
  }
}

export default new AlertasPanelService();