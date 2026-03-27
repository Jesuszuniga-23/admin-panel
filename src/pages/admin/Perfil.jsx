// src/pages/admin/Perfil.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Hash, Phone,
  Calendar, LogOut, ChevronLeft,
  Loader, CheckCircle, XCircle, Lock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
// ✅ CORREGIDO: Importar con nombre correcto (lowercase)
import alertasService from '../../services/admin/alertas.service';
import authService from '../../services/auth.service';

// Función para formatear nombres
const formatearNombre = (nombre) => {
  if (!nombre) return '';
  
  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã�', para: 'Á' },
    { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' }, { de: 'Ã“', para: 'Ó' },
    { de: 'Ãš', para: 'Ú' }, { de: 'Ã±', para: 'ñ' }, { de: 'Ã‘', para: 'Ñ' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
  ];
  
  let nombreNormalizado = nombre;
  reemplazos.forEach(({ de, para }) => {
    nombreNormalizado = nombreNormalizado.split(de).join(para);
  });
  
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

// Componente InfoItem
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
    <div className="p-1.5 bg-white rounded-lg shadow-sm">
      <Icon size={16} className="text-blue-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value || 'No registrado'}</p>
    </div>
  </div>
);

// Componente para estadística
const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mx-auto mb-3`}>
        <Icon size={24} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

const Perfil = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [totalCerradasManual, setTotalCerradasManual] = useState(0);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  
  // ✅ REF para AbortController
  const abortControllerRef = useRef(null);

  const nombreFormateado = user?.nombre ? formatearNombre(user.nombre) : '';
  
  // Obtener tipo de alerta permitido según rol
  const tipoAlertaPermitido = authService.getTipoAlertaPermitido();

  // ✅ Función para cargar total de alertas cerradas con AbortController
  const cargarTotalCerradasManual = useCallback(async () => {
    if (!user?.id) return;
    
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en Perfil');
    }
    
    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    
    try {
      setCargandoEstadisticas(true);
      
      console.log('Cargando total de alertas cerradas por usuario:', user.id);
      
      const params = { signal: abortControllerRef.current.signal };
      if (tipoAlertaPermitido) {
        params.tipo = tipoAlertaPermitido;
      }
      
      const response = await alertasService.obtenerCerradasManual({ 
        admin_id: user.id,
        limite: 1000,
        ...params
      });
      
      console.log('Respuesta:', response);
      
      if (response && response.data) {
        const total = response.data.length;
        setTotalCerradasManual(total);
      } else {
        setTotalCerradasManual(0);
      }
    } catch (error) {
      // ✅ Ignorar errores de cancelación
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando estadísticas:', error);
        setTotalCerradasManual(0);
      }
    } finally {
      setCargandoEstadisticas(false);
    }
  }, [user?.id, tipoAlertaPermitido]);

  // ✅ Efecto con limpieza
  useEffect(() => {
    cargarTotalCerradasManual();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente Perfil desmontado - peticiones canceladas');
      }
    };
  }, [cargarTotalCerradasManual]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Texto legible para roles
  const rolDisplay = {
    superadmin: 'Super Administrador',
    admin: 'Administrador',
    policia: 'Policía',
    ambulancia: 'Ambulancia',
    operador_tecnico: 'Operador Técnico',
    operador_policial: 'Operador Policial',
    operador_medico: 'Operador Médico',
    operador_general: 'Operador General'
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-slate-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-white rounded-xl transition-all duration-200"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mi Perfil</h1>
            <p className="text-sm text-gray-500 mt-0.5">Información de tu cuenta</p>
          </div>
        </div>

        {/* Tarjeta de perfil */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden mb-6">
          {/* Cabecera con gradiente según rol */}
          <div className={`bg-gradient-to-r ${
            user.rol === 'policia' ? 'from-blue-600 to-blue-700' :
            user.rol === 'ambulancia' ? 'from-green-600 to-emerald-700' :
            user.rol === 'admin' ? 'from-purple-600 to-indigo-700' :
            user.rol === 'superadmin' ? 'from-red-600 to-rose-700' :
            user.rol === 'operador_tecnico' ? 'from-cyan-600 to-teal-700' :
            user.rol === 'operador_policial' ? 'from-indigo-600 to-blue-700' :
            user.rol === 'operador_medico' ? 'from-emerald-600 to-green-700' :
            'from-gray-600 to-gray-700'
          } px-6 py-8 text-center`}>
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="text-3xl font-bold text-blue-600">
                {nombreFormateado?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{nombreFormateado}</h2>
            <p className="text-blue-100 text-sm mt-1 capitalize">{rolDisplay[user.rol] || user.rol}</p>
            {user.rol !== 'admin' && user.rol !== 'superadmin' && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs text-white">
                <Lock size={12} />
                <span>Permisos limitados según rol</span>
              </div>
            )}
          </div>

          {/* Información personal */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Nombre completo" value={nombreFormateado} icon={User} />
              <InfoItem label="Correo electrónico" value={user.email} icon={Mail} />
              <InfoItem label="Rol" value={rolDisplay[user.rol] || user.rol} icon={Shield} />
              <InfoItem label="Placa" value={user.placa || 'No asignada'} icon={Hash} />
              <InfoItem label="Teléfono" value={user.telefono || 'No registrado'} icon={Phone} />
              <InfoItem label="Miembro desde" value={new Date().toLocaleDateString('es-MX')} icon={Calendar} />
            </div>
          </div>
        </div>

        {/* Estadísticas de actividad */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Mi actividad</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Resumen de alertas gestionadas
              {tipoAlertaPermitido && ` (${tipoAlertaPermitido === 'panico' ? 'Solo Pánico' : 'Solo Médicas'})`}
            </p>
          </div>
          
          <div className="p-6">
            {cargandoEstadisticas ? (
              <div className="text-center py-8">
                <Loader size={24} className="animate-spin text-green-600 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Cargando estadísticas...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard 
                  label="Alertas cerradas manualmente" 
                  value={totalCerradasManual} 
                  icon={CheckCircle}
                  color="green"
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón de logout */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <LogOut size={18} />
            )}
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Perfil;