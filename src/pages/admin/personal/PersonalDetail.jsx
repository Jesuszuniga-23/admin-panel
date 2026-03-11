import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, Hash, Calendar, Clock,
  ChevronLeft, Edit, Power, Trash2, Smartphone,
  CheckCircle, XCircle, AlertCircle, Loader
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';

const PersonalDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [personal, setPersonal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPersonal();
  }, [id]);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      console.log("📡 Cargando detalle personal ID:", id);
      const response = await personalService.obtenerPersonal(id);
      console.log("✅ Datos recibidos:", response.data);
      setPersonal(response.data);
    } catch (error) {
      console.error("Error cargando personal:", error);
      setError(error.error || 'Error al cargar los datos');
      toast.error('No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async () => {
    const nuevoEstado = !personal.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    
    if (!window.confirm(`¿Estás seguro de ${accion} a ${personal.nombre}?`)) {
      return;
    }

    try {
      await personalService.toggleActivo(id, nuevoEstado);
      toast.success(`Personal ${accion}do correctamente`);
      cargarPersonal(); // Recargar datos
    } catch (error) {
      console.error(`Error al ${accion}:`, error);
      toast.error(error.error || `Error al ${accion} personal`);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${personal.nombre}?`)) {
      return;
    }

    try {
      await personalService.eliminarPersonal(id);
      toast.success('Personal eliminado correctamente');
      navigate('/admin/personal');
    } catch (error) {
      console.error("Error eliminando:", error);
      toast.error(error.error || 'Error al eliminar personal');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No registrado';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando información del personal...</p>
        </div>
      </div>
    );
  }

  if (error || !personal) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 rounded-xl shadow p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se encontró el personal'}</p>
          <button
            onClick={() => navigate('/admin/personal')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/personal')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detalle del Personal</h1>
            <p className="text-sm text-gray-500 mt-1">
              Información completa de {personal.nombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            personal.activo 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {personal.activo ? 'Activo' : 'Inactivo'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            personal.disponible 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {personal.disponible ? 'Disponible' : 'Ocupado'}
          </span>
        </div>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Cabecera con avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-blue-600">
                {personal.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{personal.nombre}</h2>
              <p className="text-blue-100 mt-1">ID: {personal.id}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoItem 
              icon={Mail} 
              label="Correo electrónico" 
              value={personal.email} 
            />
            <InfoItem 
              icon={Phone} 
              label="Teléfono" 
              value={personal.telefono || 'No registrado'} 
            />
            <InfoItem 
              icon={Hash} 
              label="Placa" 
              value={personal.placa} 
            />
            <InfoItem 
              icon={Shield} 
              label="Rol" 
              value={
                <span className={`px-2 py-1 rounded-full text-xs ${
                  personal.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                  personal.rol === 'superadmin' ? 'bg-red-100 text-red-700' :
                  personal.rol === 'policia' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {personal.rol}
                </span>
              } 
            />
          </div>

          {/* Sección de auditoría */}
          <div className="border-t pt-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuditItem 
                icon={Calendar} 
                label="Creado el" 
                value={formatDate(personal.creado_en)} 
              />
              <AuditItem 
                icon={User} 
                label="Creado por" 
                value={personal.creador?.nombre || 'Sistema'} 
              />
              <AuditItem 
                icon={Calendar} 
                label="Actualizado el" 
                value={formatDate(personal.actualizado_en)} 
              />
              <AuditItem 
                icon={User} 
                label="Actualizado por" 
                value={personal.actualizador?.nombre || 'Sistema'} 
              />
              {personal.fecha_eliminacion && (
                <AuditItem 
                  icon={Trash2} 
                  label="Eliminado el" 
                  value={formatDate(personal.fecha_eliminacion)} 
                  className="text-red-600"
                />
              )}
            </div>
          </div>

          {/* Dispositivos */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Smartphone size={20} />
              Dispositivos registrados
            </h3>
            
            {personal.DeviceTokens && personal.DeviceTokens.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {personal.DeviceTokens.map((token, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{token.plataforma}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      token.activo 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {token.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay dispositivos registrados</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleToggleActivo}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              personal.activo 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Power size={18} />
            {personal.activo ? 'Desactivar' : 'Activar'}
          </button>
          
          <button
            onClick={() => navigate(`/admin/personal/editar/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit size={18} />
            Editar
          </button>
          
          <button
            onClick={handleEliminar}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para items de información
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <Icon size={20} className="text-blue-600 mt-1" />
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="text-sm font-medium text-gray-800 mt-1">{value}</div>
    </div>
  </div>
);

// Componente auxiliar para items de auditoría
const AuditItem = ({ icon: Icon, label, value, className = '' }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="text-gray-400 mt-1" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-medium text-gray-800 ${className}`}>{value}</p>
    </div>
  </div>
);

export default PersonalDetail;