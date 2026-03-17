import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Hash, Phone, Smartphone,
  Calendar, LogOut, ChevronLeft,
  Loader, Clock, CheckCircle, Truck, Users,
  Activity
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

// Función para formatear nombres (acentos y mayúsculas)
const formatearNombre = (nombre) => {
  if (!nombre) return '';
  
  // Mapa de caracteres mal codificados
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
  
  // Capitalizar primera letra de cada palabra
  return nombreNormalizado
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const Perfil = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Formatear nombre del usuario
  const nombreFormateado = user?.nombre ? formatearNombre(user.nombre) : '';

  // Datos de ejemplo (luego del backend)
  const stats = [
    { label: 'Alertas atendidas', value: 42, icon: CheckCircle, color: 'green' },
    { label: 'Unidades asignadas', value: 3, icon: Truck, color: 'blue' },
    { label: 'Personal a cargo', value: 8, icon: Users, color: 'purple' },
    { label: 'Horas activo', value: '127h', icon: Clock, color: 'amber' }
  ];

  const dispositivos = [
    { tipo: 'Web', nombre: 'Chrome - Windows', ultimoAcceso: 'Hace 5 min', activo: true },
    { tipo: 'Android', nombre: 'Samsung Galaxy', ultimoAcceso: 'Hace 2 horas', activo: false }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - RESPONSIVE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="sm:w-5 sm:h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Perfil</h1>
              <p className="text-xs sm:text-sm text-gray-500">Información personal y configuración</p>
            </div>
          </div>
        </div>

        {/* Grid principal - RESPONSIVE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Columna izquierda - Tarjeta principal */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
              {/* Cabecera */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-6 sm:py-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {nombreFormateado?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white truncate px-2">{nombreFormateado}</h2>
                <p className="text-blue-100 text-xs sm:text-sm capitalize mt-1">{user.rol}</p>
                <p className="text-blue-200 text-xs mt-2">ID: {user.id}</p>
              </div>

              {/* Stats rápidas - RESPONSIVE */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 border-b">
                {stats.slice(0, 2).map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="text-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mx-auto mb-1 sm:mb-2`}>
                       <Icon size={14} className={`sm:w-4 sm:h-4 text-${stat.color}-600`} />
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-gray-800">{stat.value}</p>
                      <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Contacto */}
              <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Mail size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{user.email}</span>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Phone size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">
                    {user.telefono || 'No registrado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - RESPONSIVE */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Información personal */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <User size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                Información personal
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <InfoItem label="Nombre" value={nombreFormateado} icon={User} />
                <InfoItem label="Email" value={user.email} icon={Mail} />
                <InfoItem label="Rol" value={user.rol} icon={Shield} badge={user.rol} />
                <InfoItem label="Placa" value={user.placa || 'No asignada'} icon={Hash} />
                <InfoItem label="Miembro desde" value={new Date().toLocaleDateString()} icon={Calendar} />
                <InfoItem label="Último acceso" value={new Date().toLocaleString()} icon={Clock} />
              </div>
            </div>

            {/* Dispositivos */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg shadow-slate-200/50 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Smartphone size={16} className="sm:w-5 sm:h-5 text-blue-600" />
                Dispositivos conectados
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                {dispositivos.map((d, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Smartphone size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{d.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">{d.tipo} · {d.ultimoAcceso}</p>
                      </div>
                    </div>
                    {d.activo && (
                      <span className="px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs whitespace-nowrap self-start sm:self-center">
                        Activo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de logout */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={logout}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <LogOut size={16} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Cerrar sesión</span>
            <span className="xs:hidden">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente InfoItem - RESPONSIVE
const InfoItem = ({ icon: Icon, label, value, badge }) => (
  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
    <Icon size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{value}</p>
      {badge && (
        <span className="inline-block mt-1 px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default Perfil;