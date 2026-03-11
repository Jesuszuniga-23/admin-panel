import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, Hash, Save, X,
  ChevronLeft, AlertCircle, CheckCircle, Loader
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';

const PersonalForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(isEditing);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    placa: '',
    rol: 'policia',
    disponible: true,
    activo: true
  });
  const [campoError, setCampoError] = useState('');
  // =====================================================
  // REFS PARA ENFOCAR CAMPOS CON ERROR
  // =====================================================
  const nombreRef = useRef();
  const emailRef = useRef();
  const telefonoRef = useRef();
  const placaRef = useRef();
  const rolRef = useRef();

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      cargarPersonal();
    }
  }, [id]);

  const cargarPersonal = async () => {
    try {
      setCargandoDatos(true);
      console.log("📡 Cargando personal ID:", id);
      const response = await personalService.obtenerPersonal(id);
      console.log("✅ Datos recibidos:", response.data);

      // Mapear los datos al formulario
      setFormData({
        nombre: response.data.nombre || '',
        email: response.data.email || '',
        telefono: response.data.telefono || '',
        placa: response.data.placa || '',
        rol: response.data.rol || 'policia',
        activo: response.data.activo ?? true,
        disponible: response.data.activo ? (response.data.disponible ?? true) : false
        
      });
    } catch (error) {
      console.error('Error cargando personal:', error);
      toast.error('Error al cargar los datos');
      navigate('/admin/personal');
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    console.log(`📝 Cambio en ${name}:`, type === 'checkbox' ? checked : value);

    // Si se está desmarcando "activo"
    if (name === 'activo' && !checked) {
      // Desmarcar también "disponible"
      setFormData(prev => ({
        ...prev,
        activo: false,
        disponible: false  // 👈 Se desmarca automáticamente
      }));
    }
    // Si se está marcando "activo"
    else if (name === 'activo' && checked) {
      // Activar solo activo, disponible se queda como estaba
      setFormData(prev => ({
        ...prev,
        activo: true
      }));
    }
    // Para otros campos
    else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const datosAEnviar = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        placa: formData.placa,
        rol: formData.rol,
        activo: formData.activo, // Tomar directamente del estado
        disponible: formData.disponible // Tomar directamente del estado
      };
      console.log("=".repeat(50));
      console.log("📤 DATOS A ENVIAR AL BACKEND:");
      console.log("📤 activo (valor):", datosAEnviar.activo);
      console.log("📤 activo (tipo):", typeof datosAEnviar.activo);
      console.log("📤 disponible:", datosAEnviar.disponible);
      console.log("📤 objeto completo:", datosAEnviar);
      console.log("=".repeat(50));

      console.log("📡 Enviando datos:", datosAEnviar);
      console.log("📡 Checkbox activo value:", formData.activo);
      if (isEditing) {
        await personalService.actualizarPersonal(id, datosAEnviar);
        toast.success('Personal actualizado correctamente');
      } else {
        await personalService.crearPersonal(datosAEnviar);
        toast.success('Personal creado correctamente');
      }
      console.log("✅ Valores enviados:", {
        activo: formData.activo,
        disponible: formData.disponible,
        tipoActivo: typeof formData.activo,
        tipoDisponible: typeof formData.disponible
      });
      navigate('/admin/personal');
    } catch (error) {
      console.error('Error guardando personal:', error);

      // 👇 CAPTURAR EL MENSAJE DE ERROR
      const mensajeError = error.error || error.message || '';

      // Mostrar el error
      toast.error(mensajeError);

      // 👇 ENFOCAR SEGÚN EL TIPO DE ERROR
      if (mensajeError.includes('Dominio') ||
        mensajeError.includes('email') ||
        mensajeError.includes('correo')) {
        // Enfocar el campo de email
        setCampoError('email');
        emailRef.current?.focus();
        setTimeout(() => setCampoError(''), 3000);
      }
      else if (mensajeError.includes('nombre')) {
        setCampoError('nombre');
        nombreRef.current?.focus();
        setTimeout(() => setCampoError(''), 3000);
      }
      else if (mensajeError.includes('teléfono') || mensajeError.includes('telefono')) {
        setCampoError('telefono');
        telefonoRef.current?.focus();
        setTimeout(() => setCampoError(''), 3000);
      }
      else if (mensajeError.includes('placa')) {
        setCampoError('placa');
        placaRef.current?.focus();
        setTimeout(() => setCampoError(''), 3000);
      }
      else if (mensajeError.includes('rol')) {
        setCampoError('rol');
        rolRef.current?.focus();
        setTimeout(() => setCampoError(''), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando datos del personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? `Editando ID: ${id} - ${formData.nombre}`
                : 'Ingresa los datos del nuevo miembro del equipo'}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        <div className="space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={nombreRef}
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Juan Pérez"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input

                ref={emailRef}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${campoError === 'email'
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500'
                  }`}
                placeholder="ejemplo@correo.com"
                disabled={isEditing} // No se debe cambiar el email en edición
              />
            </div>
            {isEditing && (
              <p className="text-xs text-gray-400 mt-1">El email no se puede modificar</p>
            )}
          </div>

          {/* Teléfono */}
          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={telefonoRef}
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={(e) => {
                  // 👇 SOLO PERMITIR NÚMEROS, ESPACIOS, GUIONES Y SÍMBOLO +
                  const valorLimpio = e.target.value.replace(/[^0-9+\-\s]/g, '');

                  // Actualizar el formData con el valor limpio
                  setFormData(prev => ({
                    ...prev,
                    telefono: valorLimpio
                  }));
                }}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${campoError === 'telefono'
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500'
                  }`}
                placeholder="Ej: 238 458 7196"
                pattern="[0-9+\-\s]+"
                title="Solo se permiten números, espacios, guiones y el símbolo +"
              />
            </div>
            {/* Mostrar ayuda si se intenta ingresar texto */}
            {formData.telefono && !/^[0-9+\-\s]+$/.test(formData.telefono) && (
              <p className="text-xs text-red-500 mt-1">
                Solo se permiten números, espacios y guiones
              </p>
            )}
          </div>

          {/* Placa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={placaRef}
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: P-001"
              />
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                ref={rolRef}
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="policia">Policía</option>
                <option value="ambulancia">Ambulancia</option>
                <option value="admin">Administrador</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Usuario activo</span>
            </label>

            <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${!formData.activo ? 'bg-gray-100 opacity-50' : 'bg-gray-50'
              }`}>
              <input
                type="checkbox"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
                disabled={!formData.activo}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Disponible</span>
            </label>
          </div>
          {/* Mensaje informativo */}
          {!formData.activo && (
            <p className="text-xs text-gray-400 text-center">
              * Un usuario inactivo no puede estar disponible
            </p>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/personal')}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PersonalForm;