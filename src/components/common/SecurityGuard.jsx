// src/components/common/SecurityGuard.jsx
import { useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../services/api/axiosConfig';

const SecurityGuard = () => {
  // ✅ REF para controlar reportes
  const reportQueueRef = useRef([]);
  const reportTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // ✅ Límites de reportes (evitar spam)
  const REPORT_LIMIT = {
    MAX_REPORTS_PER_MINUTE: 10,
    BATCH_SIZE: 5,
    BATCH_DELAY: 5000 // 5 segundos entre lotes
  };
  
  // ✅ Contador de reportes recientes
  const recentReportsRef = useRef([]);
  
  // ✅ Función para limpiar reportes antiguos
  const limpiarReportesAntiguos = useCallback(() => {
    const ahora = Date.now();
    const unMinutoAtras = ahora - 60000;
    recentReportsRef.current = recentReportsRef.current.filter(
      timestamp => timestamp > unMinutoAtras
    );
  }, []);
  
  // ✅ Verificar si se puede reportar
  const puedeReportar = useCallback(() => {
    limpiarReportesAntiguos();
    return recentReportsRef.current.length < REPORT_LIMIT.MAX_REPORTS_PER_MINUTE;
  }, [limpiarReportesAntiguos]);
  
  // ✅ Enviar lote de reportes
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
  
  // ✅ Programar envío de lote
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
  
  // ✅ Reportar intento (con debounce y batching)
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
  
  // ✅ Limpiar al desmontar
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
  
  useEffect(() => {
    if (!window.isSecureContext) {
      console.warn('⚠️ Contexto no seguro. Algunas protecciones pueden no funcionar.');
    }
    
    // 1. BLOQUEAR BOTÓN DERECHO
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportarIntento('contextmenu', {
        target: e.target.tagName,
        className: e.target.className,
        id: e.target.id
      });
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);
    
    // 2. BLOQUEAR COPIAR (excepto en inputs)
    const handleCopy = (e) => {
      const target = e.target;
      const camposPermitidos = ['INPUT', 'TEXTAREA'];
      const esCampoPermitido = camposPermitidos.includes(target.tagName) || target.isContentEditable;
      
      if (!esCampoPermitido) {
        e.preventDefault();
        const selection = window.getSelection()?.toString();
        reportarIntento('copy', {
          selection: selection?.substring(0, 100),
          target: target.tagName
        });
        return false;
      }
    };
    document.addEventListener('copy', handleCopy);
    
    // 3. BLOQUEAR PEGAR (excepto en inputs)
    const handlePaste = (e) => {
      const target = e.target;
      const camposPermitidos = ['INPUT', 'TEXTAREA'];
      const esCampoPermitido = camposPermitidos.includes(target.tagName) || target.isContentEditable;
      
      if (!esCampoPermitido) {
        e.preventDefault();
        reportarIntento('paste', {
          target: target.tagName,
          isInput: esCampoPermitido
        });
        return false;
      }
    };
    document.addEventListener('paste', handlePaste);
    
    // 4. DETECTAR CAPTURA DE PANTALLA
    const handleKeyDown = (e) => {
      // Tecla PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        reportarIntento('screenshot', { method: 'PrintScreen_key' });
        return false;
      }
      
      // Ctrl+Shift+S o Cmd+Shift+S
      if ((e.ctrlKey && e.shiftKey && e.key === 'S') ||
          (e.metaKey && e.shiftKey && e.key === 'S')) {
        e.preventDefault();
        reportarIntento('screenshot', {
          method: 'shortcut',
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          meta: e.metaKey,
          key: e.key
        });
        return false;
      }
      
      // 🔓 F12 DESBLOQUEADO PARA DEPURACIÓN
      // if (e.key === 'F12') {
      //   e.preventDefault();
      //   return false;
      // }
      
      // 🔓 Ctrl+Shift+I DESBLOQUEADO PARA DEPURACIÓN
      // if ((e.ctrlKey && e.shiftKey && e.key === 'I') ||
      //     (e.metaKey && e.shiftKey && e.key === 'I')) {
      //   e.preventDefault();
      //   return false;
      // }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // 5. BLOQUEAR IMPRESIÓN
    const handleBeforePrint = (e) => {
      e.preventDefault();
      reportarIntento('print', { method: 'beforeprint' });
      return false;
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    
    // 6. PREVENIR ARRASTRAR
    const handleDragStart = (e) => {
      e.preventDefault();
      reportarIntento('drag', {
        target: e.target.tagName,
        dataType: e.dataTransfer?.types?.[0]
      });
      return false;
    };
    document.addEventListener('dragstart', handleDragStart);
    
    // 7. DETECTAR CAMBIO DE TAMAÑO DE VENTANA
    let resizeTimer;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth < 300 || window.innerHeight < 200) {
          reportarIntento('resize', {
            width: window.innerWidth,
            height: window.innerHeight
          });
        }
      }, 500);
    };
    window.addEventListener('resize', handleResize);
    
    // 8. DETECTAR VISIBILITY CHANGE
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportarIntento('visibility', { hidden: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (resizeTimer) clearTimeout(resizeTimer);
      if (reportTimeoutRef.current) clearTimeout(reportTimeoutRef.current);
    };
  }, [reportarIntento]);
  
  return null;
};

export default SecurityGuard;