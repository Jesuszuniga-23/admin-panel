import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Hash, Phone, Smartphone,
  Calendar, LogOut, Edit2, Save, X, ChevronLeft,
  Loader, Clock, CheckCircle, Truck, Users,
  Activity, Lock
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const Perfil = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [editandoTelefono, setEditandoTelefono] = useState(false);
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [guardando, setGuardando] = useState(false);

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

  const handleActualizarTelefono = async () => {
    if (!telefono.trim()) {
      toast.error('El teléfono no puede estar vacío');
      return;
    }

    setGuardando(true);
    try {
      // TODO: Llamar al endpoint real
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Teléfono actualizado');
      setEditandoTelefono(false);
      user.telefono = telefono;
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setGuardando(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
            <p className="text-sm text-gray-500">Información personal y configuración</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Tarjeta principal */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {user.nombre?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">{user.nombre}</h2>
              <p className="text-blue-100 text-sm capitalize mt-1">{user.rol}</p>
              <p className="text-blue-200 text-xs mt-2">ID: {user.id}</p>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b">
              {stats.slice(0, 2).map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center">
                    <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <Icon size={18} className={`text-${stat.color}-600`} />
                    </div>
                    <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Contacto */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400" />
                {editandoTelefono ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded-lg text-sm"
                      autoFocus
                    />
                    <button
                      onClick={handleActualizarTelefono}
                      className="p-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setEditandoTelefono(false);
                        setTelefono(user.telefono || '');
                      }}
                      className="p-1 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-600 flex-1">
                      {user.telefono || 'No registrado'}
                    </span>
                    <button
                      onClick={() => setEditandoTelefono(true)}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Información personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem label="Nombre" value={user.nombre} icon={User} />
              <InfoItem label="Email" value={user.email} icon={Mail} />
              <InfoItem label="Rol" value={user.rol} icon={Shield} badge={user.rol} />
              <InfoItem label="Placa" value={user.placa || 'No asignada'} icon={Hash} />
              <InfoItem label="Miembro desde" value={new Date().toLocaleDateString()} icon={Calendar} />
              <InfoItem label="Último acceso" value={new Date().toLocaleString()} icon={Clock} />
            </div>
          </div>

          {/* Dispositivos */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-blue-600" />
              Dispositivos conectados
            </h3>
            
            <div className="space-y-3">
              {dispositivos.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.nombre}</p>
                      <p className="text-xs text-gray-500">{d.tipo} · {d.ultimoAcceso}</p>
                    </div>
                  </div>
                  {d.activo && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Activo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-blue-600" />
              Seguridad
            </h3>
            
            <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Cambiar contraseña</span>
            </button>
          </div>
        </div>
      </div>

      {/* Botón de logout fijo abajo */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, badge }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon size={16} className="text-gray-400 mt-0.5" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
      {badge && (
        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default Perfil;