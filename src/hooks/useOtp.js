// src/hooks/useOtp.js
import { useState } from 'react';
import toast from 'react-hot-toast';
import alertasPanelService from '../services/admin/alertasPanel.service';

export const useOtp = () => {
  const [solicitando, setSolicitando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiracion, setOtpExpiracion] = useState(null);

  const solicitarOtp = async (alertaId) => {
    setSolicitando(true);
    try {
      const response = await alertasPanelService.solicitarOtp(alertaId);
      
      if (response.success) {
        setShowModal(true);
        setOtpEmail(response.email_ofuscado);
        setOtpExpiracion(response.expiracion);
        toast.success(response.message);
        return { success: true, message: response.message };
      } else {
        toast.error(response.error || 'Error al solicitar código');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error solicitando OTP:', error);
      const msg = error.response?.data?.error || 'Error al solicitar código';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setSolicitando(false);
    }
  };

  const verificarOtp = async (alertaId, codigo) => {
    if (!codigo || codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return { success: false, error: 'Código inválido' };
    }
    
    setVerificando(true);
    try {
      const response = await alertasPanelService.verificarOtp(alertaId, codigo);
      
      if (response.success) {
        setShowModal(false);
        toast.success('Código verificado. Mostrando datos completos.');
        return { success: true, data: response.data };
      } else {
        toast.error(response.error || 'Código inválido');
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error verificando OTP:', error);
      const msg = error.response?.data?.error || 'Error al verificar código';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setVerificando(false);
    }
  };

  const cerrarModal = () => {
    setShowModal(false);
    setOtpEmail('');
    setOtpExpiracion(null);
  };

  return {
    solicitando,
    verificando,
    showModal,
    otpEmail,
    otpExpiracion,
    solicitarOtp,
    verificarOtp,
    cerrarModal
  };
};