// src/pages/auth/Verificar2FA.jsx
// REEMPLAZAR TODO EL ARCHIVO CON ESTA VERSIÓN CORREGIDA

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Loader, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';

const Verificar2FA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [email, setEmail] = useState('');
  const [tiempoEspera, setTiempoEspera] = useState(0);
  const [error, setError] = useState('');
  const [errorDetalle, setErrorDetalle] = useState('');
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');

    console.log('📧 Email de verificación:', emailParam);

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      setError('No se encontró el email de verificación');
      setErrorDetalle('Por favor, inicia sesión nuevamente');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate]);

  useEffect(() => {
    if (tiempoEspera > 0) {
      timerRef.current = setTimeout(() => setTiempoEspera(tiempoEspera - 1), 1000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [tiempoEspera]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ✅ Función para limpiar errores y resetear el estado
  const limpiarError = useCallback(() => {
    setError('');
    setErrorDetalle('');
    setCodigo('');
    // No resetear el tiempo de espera para no permitir spam
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Limpiar error anterior antes de nuevo intento
    limpiarError();
    
    if (codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición 2FA anterior cancelada');
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      console.log('🔐 Verificando código 2FA...');
      const response = await authService.verificar2FA(codigo, {
        signal: abortControllerRef.current.signal
      });
      
      console.log('📦 Respuesta del backend:', response);
      
      if (response.success) {
        toast.success('Verificación exitosa');
        
        if (response.usuario) {
          console.log('✅ Guardando usuario en store:', response.usuario);
          setUser(response.usuario);
        }
        
        const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
        
        if (rolesAdmin.includes(response.usuario?.rol)) {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/mobile', { replace: true });
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error verificando código:', error);
        const errorMsg = error.response?.data?.error || 'Error al verificar código';
        
        // ✅ Guardar error detallado para mostrar al usuario
        setError(errorMsg);
        
        // ✅ Mensaje específico según tipo de error
        if (errorMsg.includes('expirado') || errorMsg.includes('expiró')) {
          setErrorDetalle('El código expiró. Usa el botón "Reenviar código" para obtener uno nuevo.');
          toast.error(errorMsg, { duration: 8000 });
          setCodigo('');
        } else if (errorMsg.includes('incorrecto')) {
          setErrorDetalle('Verifica que el código sea correcto. Puedes solicitar uno nuevo si lo necesitas.');
          toast.error(errorMsg);
          // ✅ Mantener el código para que el usuario pueda corregirlo
        } else if (errorMsg.includes('bloqueado')) {
          setErrorDetalle('Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.');
          toast.error(errorMsg, { duration: 8000 });
        } else {
          setErrorDetalle('Intenta nuevamente o usa el botón "Reenviar código" si el problema persiste.');
          toast.error(errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = useCallback(async () => {
    if (tiempoEspera > 0) {
      toast.info(`Espera ${tiempoEspera} segundos antes de reenviar`);
      return;
    }

    // ✅ Limpiar error antes de reenviar
    limpiarError();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición de reenvío anterior cancelada');
    }
    
    abortControllerRef.current = new AbortController();
    
    setReenviando(true);
    try {
      console.log('📧 Reenviando código 2FA...');
      const response = await authService.reenviarCodigo2FA({
        signal: abortControllerRef.current.signal
      });
      
      if (response.success) {
        toast.success(response.message || 'Código reenviado correctamente');
        setTiempoEspera(30);
        setCodigo('');
        setError('');
        setErrorDetalle('');
      } else {
        const errorMsg = response.error || 'Error al reenviar código';
        setError(errorMsg);
        setErrorDetalle('Intenta nuevamente en unos momentos.');
        toast.error(errorMsg);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error reenviando código:', error);
        const errorMsg = error.response?.data?.error || 'Error al reenviar código';
        setError(errorMsg);
        
        if (errorMsg.includes('demasiados') || errorMsg.includes('límite')) {
          setErrorDetalle('Has solicitado demasiados códigos. Espera unos minutos.');
        } else {
          setErrorDetalle('No se pudo reenviar el código. Verifica tu conexión.');
        }
        toast.error(errorMsg);
      }
    } finally {
      setReenviando(false);
    }
  }, [tiempoEspera, limpiarError]);

  const handleVolverALogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={handleVolverALogin}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver al inicio
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Verificación en dos pasos</h1>
            <p className="text-gray-500 mt-2">
              Ingresa el código de verificación enviado a
            </p>
            <p className="font-medium text-gray-700 mt-1">{email}</p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">{error}</p>
                  {errorDetalle && (
                    <p className="text-red-600 text-sm mt-1">{errorDetalle}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={limpiarError}
                  className="flex-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors"
                >
                  Intentar de nuevo
                </button>
                {tiempoEspera === 0 && (
                  <button
                    onClick={handleReenviar}
                    disabled={reenviando}
                    className="flex-1 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={14} className={reenviando ? 'animate-spin' : ''} />
                    Reenviar código
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  El código expira en 10 minutos
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || codigo.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <CheckCircle size={20} />
                )}
                {loading ? 'Verificando...' : 'Verificar'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando || tiempoEspera > 0}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                >
                  <Mail size={16} />
                  {tiempoEspera > 0 ? `Reenviar en ${tiempoEspera}s` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Si no recibes el código, revisa tu bandeja de spam o contacta al administrador.</p>
        </div>
      </div>
    </div>
  );
};

export default Verificar2FA;