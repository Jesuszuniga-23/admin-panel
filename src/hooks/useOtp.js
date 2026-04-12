// src/hooks/useOtp.js
import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import alertasPanelService from '../services/admin/alertasPanel.service';

export const useOtp = () => {
  const [solicitando, setSolicitando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiracion, setOtpExpiracion] = useState(null);
  const [codigoOtp, setCodigoOtp] = useState('');

  const solicitarAbortControllerRef = useRef(null);
  const verificarAbortControllerRef = useRef(null);

  const limpiarEstado = useCallback(() => {
    setShowModal(false);
    setOtpEmail('');
    setOtpExpiracion(null);
    setCodigoOtp('');
  }, []);

  const cancelarPeticiones = useCallback(() => {
    if (solicitarAbortControllerRef.current) {
      solicitarAbortControllerRef.current.abort();
      solicitarAbortControllerRef.current = null;
    }
    if (verificarAbortControllerRef.current) {
      verificarAbortControllerRef.current.abort();
      verificarAbortControllerRef.current = null;
    }
  }, []);

  const solicitarOtp = useCallback(async (alertaId) => {
    if (!alertaId) {
      toast.error('ID de alerta no válido');
      return { success: false, error: 'ID de alerta no válido' };
    }

    if (solicitarAbortControllerRef.current) {
      solicitarAbortControllerRef.current.abort();
      console.log('🛑 Petición OTP anterior cancelada');
    }

    solicitarAbortControllerRef.current = new AbortController();

    setSolicitando(true);
    try {
      const response = await alertasPanelService.solicitarOtp(alertaId, {
        signal: solicitarAbortControllerRef.current.signal
      });

      if (response.success) {
        setShowModal(true);
        setOtpEmail(response.email_ofuscado);
        setOtpExpiracion(response.expiracion);
        toast.success('' + (response.message || 'Código enviado a tu correo'), {
          duration: 5000
        });
        return { success: true, message: response.message };
      } else {
        const errorMsg = response.error || 'Error al solicitar código';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(' Solicitud OTP cancelada');
        return { success: false, cancelled: true };
      }
      console.error('Error solicitando OTP:', error);
      const msg = error.response?.data?.error || 'Error al solicitar código';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setSolicitando(false);
      solicitarAbortControllerRef.current = null;
    }
  }, []);

  const verificarOtp = useCallback(async (alertaId, codigo) => {
    if (!alertaId) {
      toast.error('ID de alerta no válido');
      return { success: false, error: 'ID de alerta no válido' };
    }

    if (!codigo || codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return { success: false, error: 'Código inválido' };
    }

    if (verificarAbortControllerRef.current) {
      verificarAbortControllerRef.current.abort();
      console.log(' Verificación OTP anterior cancelada');
    }

    verificarAbortControllerRef.current = new AbortController();

    setVerificando(true);
    try {
      const response = await alertasPanelService.verificarOtp(alertaId, codigo, {
        signal: verificarAbortControllerRef.current.signal
      });

      if (response.success) {
        limpiarEstado();
        toast.success(' Código verificado. Bienvenido.', {
          duration: 3000
        });
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error || 'Código inválido';
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log(' Verificación OTP cancelada');
        return { success: false, cancelled: true };
      }
      console.error('Error verificando OTP:', error);
      const msg = error.response?.data?.error || 'Error al verificar código';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setVerificando(false);
      verificarAbortControllerRef.current = null;
    }
  }, [limpiarEstado]);

  const cerrarModal = useCallback(() => {
    limpiarEstado();
  }, [limpiarEstado]);

  const cleanup = useCallback(() => {
    cancelarPeticiones();
    limpiarEstado();
  }, [cancelarPeticiones, limpiarEstado]);

  return {
    solicitando,
    verificando,
    showModal,
    otpEmail,
    otpExpiracion,
    codigoOtp,
    setCodigoOtp,
    solicitarOtp,
    verificarOtp,
    cerrarModal,
    cleanup,
    isExpired: otpExpiracion ? new Date() > new Date(otpExpiracion) : false,
    tiempoRestante: otpExpiracion ? Math.max(0, Math.floor((new Date(otpExpiracion) - new Date()) / 1000)) : 0
  };
};

// Versión con reintentos automáticos
export const useOtpWithRetry = (maxRetries = 3, retryDelay = 2000) => {
  const baseOtp = useOtp();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const solicitarOtpConReintento = async (alertaId) => {
    setRetryCount(0);
    return intentarSolicitar(alertaId);
  };

  const intentarSolicitar = async (alertaId) => {
    const result = await baseOtp.solicitarOtp(alertaId);

    if (!result.success && !result.cancelled && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setIsRetrying(true);

      toast.loading(`Reintentando... (${retryCount + 1}/${maxRetries})`, { id: 'otp-retry' });

      await new Promise(resolve => setTimeout(resolve, retryDelay));

      toast.dismiss('otp-retry');
      setIsRetrying(false);

      return intentarSolicitar(alertaId);
    }

    setIsRetrying(false);
    return result;
  };

  return {
    ...baseOtp,
    solicitarOtp: solicitarOtpConReintento,
    isRetrying,
    retryCount
  };
};

//  Versión con temporizador automático para cierre del modal
export const useOtpWithTimer = (autoCloseDelay = 60000) => {
  const baseOtp = useOtp();
  const timerRef = useRef(null);

  const iniciarTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (baseOtp.showModal) {
        baseOtp.cerrarModal();
        toast.error('Tiempo de espera agotado. Solicita un nuevo código.', {
          duration: 5000
        });
      }
    }, autoCloseDelay);
  }, [baseOtp, autoCloseDelay]);

  const limpiarTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const solicitarOtp = useCallback(async (alertaId) => {
    limpiarTimer();
    const result = await baseOtp.solicitarOtp(alertaId);
    if (result.success) {
      iniciarTimer();
    }
    return result;
  }, [baseOtp, limpiarTimer, iniciarTimer]);

  const cerrarModal = useCallback(() => {
    limpiarTimer();
    baseOtp.cerrarModal();
  }, [baseOtp, limpiarTimer]);

  //  Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarTimer();
    };
  }, [limpiarTimer]);

  return {
    ...baseOtp,
    solicitarOtp,
    cerrarModal
  };
};