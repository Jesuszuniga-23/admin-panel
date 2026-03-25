// src/pages/auth/Verificar2FA.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Loader, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');

    console.log('📧 Email de verificación:', emailParam);

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      setError('No se encontró el email de verificación');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [location, navigate]);

  useEffect(() => {
    if (tiempoEspera > 0) {
      const timer = setTimeout(() => setTiempoEspera(tiempoEspera - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tiempoEspera]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verificando código 2FA...');
      const response = await authService.verificar2FA(codigo);
      
      console.log('📦 Respuesta del backend:', response);
      
      if (response.success) {
        toast.success('Verificación exitosa');
        
        // ✅ GUARDAR EL USUARIO EN EL STORE
        if (response.usuario) {
          console.log('✅ Guardando usuario en store:', response.usuario);
          setUser(response.usuario);
        } else {
          console.error('❌ No hay usuario en la respuesta');
        }
        
        const rolesAdmin = ['superadmin', 'admin', 'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'];
        if (rolesAdmin.includes(response.usuario?.rol)) {
          console.log('✅ Redirigiendo a /admin/dashboard');
          window.location.href = '/admin/dashboard';
        } else {
          console.log('✅ Redirigiendo a /mobile');
          window.location.href = '/mobile';
        }
      } else {
        toast.error(response.error || 'Código incorrecto');
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      const errorMsg = error.response?.data?.error || 'Error al verificar código';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (tiempoEspera > 0) return;

    setReenviando(true);
    try {
      console.log('📧 Reenviando código 2FA...');
      const response = await authService.reenviarCodigo2FA();
      
      if (response.success) {
        toast.success(response.message || 'Código reenviado correctamente');
        setTiempoEspera(60);
      } else {
        toast.error(response.error || 'Error al reenviar código');
      }
    } catch (error) {
      console.error('Error reenviando código:', error);
      toast.error(error.response?.data?.error || 'Error al reenviar código');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700"
              >
                Ir al inicio de sesión
              </button>
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
                  className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  disabled={!!error}
                />
              </div>

              <button
                type="submit"
                disabled={loading || codigo.length !== 6 || !!error}
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
                  disabled={reenviando || tiempoEspera > 0 || !!error}
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