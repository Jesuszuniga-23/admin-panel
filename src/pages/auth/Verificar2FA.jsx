// src/pages/auth/Verificar2FA.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/auth.service';

const Verificar2FA = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [emailOfuscado, setEmailOfuscado] = useState('');
  const [tiempoRestante, setTiempoRestante] = useState(300);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const email = params.get('email');
    const token = localStorage.getItem('pending_2fa_token');
    
    if (email) {
      setEmailOfuscado(email);
    }
    
    if (token) {
      setPendingToken(token);
    } else {
      setError('No hay sesión pendiente de verificación');
    }
    
    const timer = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('El código ha expirado. Por favor, inicia sesión nuevamente.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location]);

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const handleVerificar = async (e) => {
    e.preventDefault();
    
    if (!codigo || codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }
    
    if (!pendingToken) {
      toast.error('Sesión expirada. Inicia sesión nuevamente.');
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await authService.verificar2FA(codigo, pendingToken);
      
      if (result.success) {
        toast.success('Verificación exitosa');
        
        const { setUser } = require('../../store/authStore').default;
        setUser(result.usuario);
        
        localStorage.removeItem('pending_2fa_token');
        
        if (result.usuario.rol === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(result.error || 'Código inválido');
        toast.error(result.error || 'Código inválido');
      }
    } catch (error) {
      setError(error.error || 'Error al verificar código');
      toast.error(error.error || 'Error al verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (!pendingToken) {
      toast.error('Sesión expirada. Inicia sesión nuevamente.');
      navigate('/login');
      return;
    }
    
    setReenviando(true);
    
    try {
      const result = await authService.reenviarCodigo2FA(pendingToken);
      
      if (result.success) {
        toast.success(result.message);
        setTiempoRestante(300);
        setError('');
      } else {
        toast.error(result.error || 'Error al reenviar código');
      }
    } catch (error) {
      toast.error(error.error || 'Error al reenviar código');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <Shield size={48} className="text-white/90" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Verificación en 2 Pasos
            </h1>
            <p className="text-blue-100 text-sm">
              Seguridad adicional requerida
            </p>
          </div>

          <div className="p-8">
            <div className="mb-6 text-center">
              <div className="flex justify-center mb-4">
                <Mail className="text-blue-500" size={40} />
              </div>
              <p className="text-gray-600 text-sm mb-2">
                Hemos enviado un código de verificación a:
              </p>
              <p className="text-gray-800 font-medium">
                {emailOfuscado || 'tu correo institucional'}
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                <Clock size={14} />
                <span>El código expira en {formatearTiempo(tiempoRestante)}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerificar}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Ingresa el código de 6 dígitos enviado a tu correo
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || codigo.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Verificar y Continuar
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleReenviar}
                disabled={reenviando}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
              >
                <RefreshCw size={14} className={reenviando ? 'animate-spin' : ''} />
                {reenviando ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => {
                  localStorage.removeItem('pending_2fa_token');
                  navigate('/login');
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mx-auto"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verificar2FA;