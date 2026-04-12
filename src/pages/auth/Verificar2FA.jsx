import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Loader, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';
import useAuthStore from '../../store/authStore';
import { obtenerTenantActual } from '../../utils/storage';

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
  const [currentTenant, setCurrentTenant] = useState('default');
  
  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const tenant = obtenerTenantActual();
    setCurrentTenant(tenant);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');

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

  const limpiarError = useCallback(() => {
    setError('');
    setErrorDetalle('');
    setCodigo('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    limpiarError();
    
    if (codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const response = await authService.verificar2FA(codigo, { signal: abortControllerRef.current.signal });
      
      if (response.success) {
        toast.success('Verificación exitosa');
        if (response.usuario) setUser(response.usuario);
        
        const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
        navigate(rolesAdmin.includes(response.usuario?.rol) ? '/admin/dashboard' : '/mobile', { replace: true });
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        const errorMsg = error.response?.data?.error || 'Error al verificar código';
        setError(errorMsg);
        setErrorDetalle(errorMsg.includes('expirado') ? 'El código expiró. Solicita uno nuevo.' : 'Verifica el código e intenta nuevamente.');
        toast.error(errorMsg);
        if (errorMsg.includes('expirado')) setCodigo('');
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

    limpiarError();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setReenviando(true);
    try {
      const response = await authService.reenviarCodigo2FA({ signal: abortControllerRef.current.signal });
      
      if (response.success) {
        toast.success(response.message || 'Código reenviado correctamente');
        setTiempoEspera(30);
        setCodigo('');
        setError('');
        setErrorDetalle('');
      } else {
        setError(response.error || 'Error al reenviar');
        toast.error(response.error || 'Error al reenviar');
      }
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        const errorMsg = error.response?.data?.error || 'Error al reenviar código';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setReenviando(false);
    }
  }, [tiempoEspera, limpiarError]);

  const handleVolverALogin = () => navigate('/login', { replace: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <button onClick={handleVolverALogin} className="mb-4 flex items-center gap-1.5 text-gray-600 hover:text-[#1E3A5F] transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Volver al inicio</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header - SOLO UN ÍCONO */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] px-6 py-8 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Verificación en dos pasos</h1>
            <p className="text-blue-100 text-xs">Código enviado a</p>
            <p className="font-medium text-white text-sm mt-1">{email}</p>
            
          </div>

          <div className="p-6">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                    {errorDetalle && <p className="text-red-600 text-xs mt-1">{errorDetalle}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={limpiarError} className="flex-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors">
                    Intentar de nuevo
                  </button>
                  {tiempoEspera === 0 && (
                    <button onClick={handleReenviar} disabled={reenviando} className="flex-1 text-xs text-[#1E3A5F] hover:text-white bg-[#1E3A5F]/10 hover:bg-[#1E3A5F] py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                      <RefreshCw size={12} className={reenviando ? 'animate-spin' : ''} />
                      Reenviar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de 6 dígitos</label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-xl tracking-widest border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-all"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">El código expira en 10 minutos</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || codigo.length !== 6}
                  className="w-full bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white py-3 rounded-xl font-medium text-sm hover:from-[#2A4E7A] hover:to-[#1E3A5F] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleReenviar}
                    disabled={reenviando || tiempoEspera > 0}
                    className="text-xs text-[#1E3A5F] hover:text-[#0F2440] disabled:opacity-50 flex items-center justify-center gap-1.5 mx-auto font-medium"
                  >
                    <Mail size={14} />
                    {tiempoEspera > 0 ? `Reenviar en ${tiempoEspera}s` : 'Reenviar código'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-gray-500">
          <p>Si no recibes el código, revisa tu bandeja de spam.</p>
        </div>
      </div>
    </div>
  );
};

export default Verificar2FA;