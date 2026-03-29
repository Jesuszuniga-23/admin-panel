// src/components/common/SecurityGuard.jsx - VERSIÓN TEMPORAL SIN BLOQUEOS
import { useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../services/api/axiosConfig';

const SecurityGuard = () => {
  const reportQueueRef = useRef([]);
  const reportTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const REPORT_LIMIT = {
    MAX_REPORTS_PER_MINUTE: 10,
    BATCH_SIZE: 5,
    BATCH_DELAY: 5000
  };
  
  const recentReportsRef = useRef([]);
  
  const limpiarReportesAntiguos = useCallback(() => {
    const ahora = Date.now();
    const unMinutoAtras = ahora - 60000;
    recentReportsRef.current = recentReportsRef.current.filter(
      timestamp => timestamp > unMinutoAtras
    );
  }, []);
  
  const puedeReportar = useCallback(() => {
    limpiarReportesAntiguos();
    return recentReportsRef.current.length < REPORT_LIMIT.MAX_REPORTS_PER_MINUTE;
  }, [limpiarReportesAntiguos]);
  
  const enviarLote = useCallback(async () => {
    if (reportQueueRef.current.length === 0) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const lote = [...reportQueueRef.current];
    reportQueueRef.current = [];
    
    try {
      await axiosInstance.post('/security/report-batch', {
        reports: lote
      }, {
        signal: abortControllerRef.current.signal
      });
      console.log(`📊 ${lote.length} reportes enviados al servidor`);
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.debug('Error enviando lote de reportes:', error);
        if (reportQueueRef.current.length === 0) {
          reportQueueRef.current = [...lote, ...reportQueueRef.current];
          scheduleEnvioLote();
        }
      }
    }
  }, []);
  
  const scheduleEnvioLote = useCallback(() => {
    if (reportTimeoutRef.current) {
      clearTimeout(reportTimeoutRef.current);
    }
    
    reportTimeoutRef.current = setTimeout(() => {
      if (reportQueueRef.current.length > 0) {
        enviarLote();
      }
    }, REPORT_LIMIT.BATCH_DELAY);
  }, [enviarLote]);
  
  const reportarIntento = useCallback(async (tipo, detalles = {}) => {
    if (!puedeReportar()) {
      console.debug(`⏱️ Reporte limitado: ${tipo}`);
      return;
    }
    
    recentReportsRef.current.push(Date.now());
    
    reportQueueRef.current.push({
      tipo,
      detalles,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    scheduleEnvioLote();
  }, [puedeReportar, scheduleEnvioLote]);
  
  useEffect(() => {
    return () => {
      if (reportTimeoutRef.current) {
        clearTimeout(reportTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // 🔓 TODOS LOS BLOQUEOS DESACTIVADOS TEMPORALMENTE PARA DEPURAR EL MAPA
  useEffect(() => {
    console.log('🔓 [SecurityGuard] MODO DEPURACIÓN - Todos los bloqueos desactivados');
    
    // Solo registrar teclas para ver si F12 funciona
    const handleKeyDown = (e) => {
      console.log('🔓 Tecla presionada:', e.key);
    };
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return null;
};

export default SecurityGuard;