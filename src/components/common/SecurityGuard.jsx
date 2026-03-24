// src/components/common/SecurityGuard.jsx
import { useEffect } from 'react';
import axiosInstance from '../../services/api/axiosConfig';

const SecurityGuard = () => {
  const reportarIntento = async (tipo, detalles = {}) => {
    try {
      await axiosInstance.post('/security/report-violation', {
        tipo,
        detalles
      });
    } catch (error) {
      console.debug('Error reportando intento:', error);
    }
  };

  useEffect(() => {
    // 1. BLOQUEAR BOTÓN DERECHO
    const handleContextMenu = (e) => {
      e.preventDefault();
      reportarIntento('contextmenu', {
        target: e.target.tagName,
        className: e.target.className
      });
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. BLOQUEAR COPIAR
    const handleCopy = (e) => {
      e.preventDefault();
      const selection = window.getSelection()?.toString();
      reportarIntento('copy', {
        selection: selection?.substring(0, 100)
      });
      return false;
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
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        reportarIntento('screenshot', { method: 'PrintScreen_key' });
        return false;
      }
      
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

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return null;
};

export default SecurityGuard;