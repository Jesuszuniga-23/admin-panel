import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de valores
 * @param {any} value - Valor a debouncear
 * @param {number} delay - Tiempo de espera en milisegundos
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.leading - Ejecutar al inicio del debounce
 * @param {boolean} options.trailing - Ejecutar al final del debounce (default: true)
 * @returns {any} Valor debounced
 */
export function useDebounce(value, delay = 500, options = { leading: false, trailing: true }) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [pendingValue, setPendingValue] = useState(null);
  const timeoutRef = useRef(null);
  const leadingCalledRef = useRef(false);

  //  Función para cancelar el debounce
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    leadingCalledRef.current = false;
    setPendingValue(null);
  }, []);

  //  Función para ejecutar inmediatamente el valor pendiente
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const valueToFlush = pendingValue !== null ? pendingValue : value;
    if (valueToFlush !== undefined) {
      setDebouncedValue(valueToFlush);
    }
    
    leadingCalledRef.current = false;
    setPendingValue(null);
  }, [pendingValue, value]);

  //  Función para ejecutar el valor actual
  const executeTrailing = useCallback((val) => {
    setDebouncedValue(val);
    setPendingValue(null);
    leadingCalledRef.current = false;
  }, []);

  useEffect(() => {
    //  Si leading está habilitado y no se ha llamado aún
    if (options.leading && !leadingCalledRef.current) {
      leadingCalledRef.current = true;
      setDebouncedValue(value);
      setPendingValue(value);
    } else {
      //  Guardar el valor pendiente
      setPendingValue(value);
    }

    //  Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    //  Solo programar trailing si está habilitado
    if (options.trailing) {
      timeoutRef.current = setTimeout(() => {
        if (pendingValue !== null || !options.leading) {
          executeTrailing(value);
        }
      }, delay);
    } else {
      //  Si no hay trailing, limpiar el timeout sin ejecutar
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
      }, delay);
    }

    //  Limpieza al desmontar o cuando cambian dependencias
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay, options.leading, options.trailing, executeTrailing]);

  //  Limpiar al desmontar
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    value: debouncedValue,
    pending: pendingValue !== null,
    cancel,
    flush
  };
}

//  Versión simplificada (compatible con la original)
export function useDebounceSimple(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

//  Versión para funciones (debounce de llamadas a función)
export function useDebouncedCallback(callback, delay = 500, options = { leading: false, trailing: true }) {
  const timeoutRef = useRef(null);
  const leadingCalledRef = useRef(false);
  const callbackRef = useRef(callback);
  
  //  Actualizar referencia del callback cuando cambia
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    leadingCalledRef.current = false;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (callbackRef.current) {
      callbackRef.current();
    }
    leadingCalledRef.current = false;
  }, []);

  const debouncedCallback = useCallback((...args) => {
    //  Si leading está habilitado y no se ha llamado aún
    if (options.leading && !leadingCalledRef.current) {
      leadingCalledRef.current = true;
      callbackRef.current(...args);
    }

    //  Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    //  Programar trailing
    if (options.trailing) {
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        leadingCalledRef.current = false;
        timeoutRef.current = null;
      }, delay);
    } else {
      //  Si no hay trailing, solo resetear el timeout
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
      }, delay);
    }
  }, [delay, options.leading, options.trailing]);

  return {
    debouncedCallback,
    cancel,
    flush
  };
}

//  Exportar por defecto la versión simple para mantener compatibilidad
export default useDebounceSimple;