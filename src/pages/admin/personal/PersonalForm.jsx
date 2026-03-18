import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, Hash, Save, X,
  ChevronLeft, AlertCircle, CheckCircle, Loader,
  AlertTriangle, Info,Lock 
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';

// Función para corregir caracteres mal codificados
const corregirTexto = (texto) => {
  if (!texto) return '';
  
  const correcciones = {
    // Minúsculas
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã±': 'ñ', 'Â¿': '¿', 'Â¡': '¡',
    
    // Mayúsculas
    'Ã�': 'Á', 'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‘': 'Ñ',
    
    // Caracteres especiales comunes
    '£': 'ú', '¤': 'ñ', '€': 'é', '‚': 'é', '¢': 'ó'
  };
  
  let textoCorregido = texto;
  Object.entries(correcciones).forEach(([de, para]) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });
  
  return textoCorregido;
};

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
  
  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    telefono: '',
    placa: '',
    rol: ''
  });
  
  const [duplicados, setDuplicados] = useState({
    email: null,
    telefono: null,
    placa: null
  });
  
  const [todosPersonales, setTodosPersonales] = useState([]);
  
  // Estados para control de clics en teléfono (solo en edición)
  const [telefonoClicks, setTelefonoClicks] = useState(0);
  const [telefonoBloqueado, setTelefonoBloqueado] = useState(isEditing);
  const [ultimoClickTelefono, setUltimoClickTelefono] = useState(0);
  
  // Refs para enfocar campos con error
  const nombreRef = useRef(null);
  const emailRef = useRef(null);
  const telefonoRef = useRef(null);
  const placaRef = useRef(null);
  const rolRef = useRef(null);

  // Timeout para resetear contador de clics
  const clickTimeoutRef = useRef(null);

  // Cargar todos los personales al inicio
  useEffect(() => {
    cargarTodosPersonales();
  }, []);

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      cargarPersonal();
    }
  }, [id]);

  // Resetear contadores cuando cambia el modo edición
  useEffect(() => {
    setTelefonoBloqueado(isEditing);
    setTelefonoClicks(0);
  }, [isEditing]);

  const cargarTodosPersonales = async () => {
    try {
      const response = await personalService.listarPersonal({ limite: 1000 });
      const personalesCorregidos = (response.data || []).map(p => ({
        ...p,
        nombre: corregirTexto(p.nombre)
      }));
      setTodosPersonales(personalesCorregidos);
    } catch (error) {
      console.error('Error cargando personales:', error);
    }
  };

  const cargarPersonal = async () => {
    try {
      setCargandoDatos(true);
      const response = await personalService.obtenerPersonal(id);
      
      setFormData({
        nombre: corregirTexto(response.data.nombre || ''),
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

  // Manejador de clics para teléfono (solo en edición) - SIN TOASTS
  const handleTelefonoClick = (e) => {
    if (!isEditing) return;
    
    // Prevenir comportamiento por defecto
    e.preventDefault();
    
    // Si ya está desbloqueado, no hacer nada
    if (!telefonoBloqueado) return;
    
    const ahora = Date.now();
    
    // Resetear contador si pasaron más de 2 segundos
    if (ahora - ultimoClickTelefono > 2000) {
      setTelefonoClicks(1);
    } else {
      setTelefonoClicks(prev => prev + 1);
    }
    setUltimoClickTelefono(ahora);
    
    // Limpiar timeout anterior
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    // Nuevo timeout para resetear contador después de 2 segundos
    clickTimeoutRef.current = setTimeout(() => {
      setTelefonoClicks(0);
    }, 2000);
    
    // Si llega a 3 clics, desbloquear
    const nuevosClicks = (ahora - ultimoClickTelefono > 2000) ? 1 : telefonoClicks + 1;
    
    if (nuevosClicks >= 3) {
      setTelefonoBloqueado(false);
      setTelefonoClicks(0);
      
      // Quitar readonly y enfocar
      setTimeout(() => {
        if (telefonoRef.current) {
          telefonoRef.current.removeAttribute('readOnly');
          telefonoRef.current.focus();
        }
      }, 100);
    }
  };

  // Validar campo específico
  const validarCampo = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'nombre':
        if (!value.trim()) {
          error = 'El nombre es obligatorio';
        } else if (value.length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          error = 'El email es obligatorio';
        } else if (!value.includes('@') || !value.includes('.')) {
          error = 'El email no es válido';
        }
        break;
        
      case 'telefono':
        if (value && value.length !== 10) {
          error = 'El teléfono debe tener 10 dígitos';
        }
        break;
        
      case 'placa':
        if (!value.trim()) {
          error = 'La placa es obligatoria';
        } else if (value.length < 3) {
          error = 'La placa debe tener al menos 3 caracteres';
        }
        break;
        
      default:
        break;
    }
    
    return error;
  };

  // Verificar duplicados (solo usuarios activos)
  const verificarDuplicado = (campo, valor) => {
    if (!valor || (isEditing && campo === 'email')) {
      setDuplicados(prev => ({ ...prev, [campo]: null }));
      return;
    }
    
    const otrosPersonales = todosPersonales.filter(p => 
      (isEditing ? p.id !== parseInt(id) : true) && p.activo === true
    );
    
    let duplicado = null;
    
    switch(campo) {
      case 'email':
        duplicado = otrosPersonales.find(p => 
          p.email?.toLowerCase() === valor.toLowerCase()
        );
        break;
      case 'telefono':
        duplicado = otrosPersonales.find(p => p.telefono === valor);
        break;
      case 'placa':
        duplicado = otrosPersonales.find(p => 
          p.placa?.toLowerCase() === valor.toLowerCase()
        );
        break;
    }
    
    setDuplicados(prev => ({
      ...prev,
      [campo]: duplicado ? {
        existe: true,
        usuario: duplicado.nombre
      } : null
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // En modo edición, verificar si los campos están bloqueados
    if (isEditing) {
      // Teléfono bloqueado?
      if (name === 'telefono' && telefonoBloqueado) {
        return; // Simplemente no hacer nada
      }
      
      // Placa y email NO se pueden modificar en edición
     if (name === 'placa' || name === 'email') {
  toast.error('Este campo no se puede modificar', {
    duration: 2000,
    icon: <Lock size={18} className="text-yellow-500" /> 
  });
  return;
}

// Rol no se puede modificar en edición
if (name === 'rol') {
  toast.error('El rol no se puede modificar', {
    duration: 2000,
    icon: <Lock size={18} className="text-yellow-500" /> 
  });
  return;
}
    }
    
    // Limpiar errores del campo
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Procesar según el tipo de campo
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setFormData(prev => ({ ...prev, telefono: soloNumeros }));
        
        const error = validarCampo(name, soloNumeros);
        setErrors(prev => ({ ...prev, [name]: error }));
        verificarDuplicado(name, soloNumeros);
      }
    }
    else if (name === 'nombre') {
      const valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData(prev => ({ ...prev, nombre: valorLimpio }));
      
      const error = validarCampo(name, valorLimpio);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    else if (name === 'placa' && !isEditing) { // Solo en creación
      const valorLimpio = value.replace(/[^a-zA-Z0-9\-]/g, '').toUpperCase();
      if (valorLimpio.length <= 10) {
        setFormData(prev => ({ ...prev, placa: valorLimpio }));
        
        const error = validarCampo(name, valorLimpio);
        setErrors(prev => ({ ...prev, [name]: error }));
        verificarDuplicado(name, valorLimpio);
      }
    }
    else if (name === 'email' && !isEditing) {
      setFormData(prev => ({ ...prev, email: value }));
      
      const error = validarCampo(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
      verificarDuplicado(name, value);
    }
    else if (name === 'activo') {
      if (!checked) {
        setFormData(prev => ({
          ...prev,
          activo: false,
          disponible: false
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          activo: true
        }));
      }
    }
    else if (name === 'disponible' && formData.activo) {
      setFormData(prev => ({
        ...prev,
        disponible: checked
      }));
    }
    else if (name === 'rol' && !isEditing) {
      setFormData(prev => ({
        ...prev,
        rol: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors = {
      nombre: validarCampo('nombre', formData.nombre),
      email: validarCampo('email', formData.email),
      telefono: validarCampo('telefono', formData.telefono),
      placa: validarCampo('placa', formData.placa),
      rol: ''
    };
    
    setErrors(newErrors);
    
    // Verificar si hay errores
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      if (newErrors.nombre) {
        nombreRef.current?.focus();
      } else if (newErrors.email) {
        emailRef.current?.focus();
      } else if (newErrors.telefono) {
        telefonoRef.current?.focus();
      } else if (newErrors.placa) {
        placaRef.current?.focus();
      }
      
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }
    
    // Verificar duplicados
    if (duplicados.email?.existe && !isEditing) {
      toast.error(`El email ${formData.email} ya está registrado por ${duplicados.email.usuario}`);
      setErrors(prev => ({ ...prev, email: 'Email ya registrado' }));
      emailRef.current?.focus();
      return;
    }
    
    if (duplicados.telefono?.existe) {
      toast.error(`El teléfono ${formData.telefono} ya está registrado por ${duplicados.telefono.usuario}`);
      setErrors(prev => ({ ...prev, telefono: 'Teléfono ya registrado' }));
      telefonoRef.current?.focus();
      return;
    }
    
    if (duplicados.placa?.existe) {
      toast.error(`La placa ${formData.placa} ya está registrada por ${duplicados.placa.usuario}`);
      setErrors(prev => ({ ...prev, placa: 'Placa ya registrada' }));
      placaRef.current?.focus();
      return;
    }
    
    setLoading(true);
    
    try {
      const datosAEnviar = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        placa: formData.placa,
        rol: formData.rol,
        activo: formData.activo,
        disponible: formData.disponible
      };
      
      if (isEditing) {
        await personalService.actualizarPersonal(id, datosAEnviar);
        toast.success('Personal actualizado correctamente');
      } else {
        await personalService.crearPersonal(datosAEnviar);
        toast.success('Personal creado correctamente');
      }
      
      navigate('/admin/personal');
    } catch (error) {
      console.error('Error guardando personal:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el color del borde
  const getBorderColor = (campo) => {
    if (errors[campo]) return 'border-red-300 bg-red-50';
    if (duplicados[campo]?.existe) return 'border-yellow-300 bg-yellow-50';
    return 'border-gray-200';
  };

  // Función para determinar si un campo está deshabilitado
  const isFieldDisabled = (campo) => {
    if (!isEditing) return false;
    
    switch(campo) {
      case 'email':
      case 'placa':
      case 'rol':
        return true;
      case 'telefono':
        return telefonoBloqueado;
      default:
        return false;
    }
  };

  // Mostrar indicador de clics restantes
  const getClicksRestantes = () => {
    if (!isEditing || !telefonoBloqueado) return null;
    const restantes = 3 - telefonoClicks;
    return restantes > 0 ? `${restantes} clic${restantes !== 1 ? 's' : ''} restantes` : '¡Ya puedes editar!';
  };

  if (cargandoDatos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando datos del personal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/personal')}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? `Editando ID: ${id} - ${formData.nombre || '...'}`
                  : 'Ingresa los datos del nuevo miembro del equipo'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('nombre')} focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Ej: José Martínez"
                  maxLength={100}
                />
              </div>
              {errors.nombre && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  disabled={isFieldDisabled('email')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('email')} ${isFieldDisabled('email') ? 'bg-gray-100 cursor-not-allowed' : ''} focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.email}
                </p>
              )}
              {duplicados.email?.existe && !errors.email && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                   Este email ya está registrado por {duplicados.email.usuario}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  El email no se puede modificar
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
                {isEditing && telefonoBloqueado && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    ( {getClicksRestantes()})
                  </span>
                )}
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={telefonoRef}
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onClick={handleTelefonoClick}
                  onChange={handleChange}
                  readOnly={isFieldDisabled('telefono')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('telefono')} ${isFieldDisabled('telefono') ? 'bg-gray-50 cursor-pointer select-none' : ''} focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="2384587196"
                  maxLength={10}
                />
              </div>
              {errors.telefono && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.telefono}
                </p>
              )}
              {duplicados.telefono?.existe && !errors.telefono && formData.telefono.length === 10 && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Este teléfono ya está registrado por {duplicados.telefono.usuario}
                </p>
              )}
              {formData.telefono && formData.telefono.length < 10 && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Faltan {10 - formData.telefono.length} dígitos
                </p>
              )}
              {isEditing && telefonoBloqueado && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Info size={12} />
                  Haz 3 clics rápidos para desbloquear ({3 - telefonoClicks} restantes)
                </p>
              )}
            </div>

            {/* Placa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  disabled={isFieldDisabled('placa')}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all uppercase ${getBorderColor('placa')} ${isFieldDisabled('placa') ? 'bg-gray-100 cursor-not-allowed' : ''} focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="P-001"
                  maxLength={10}
                />
              </div>
              {errors.placa && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.placa}
                </p>
              )}
              {duplicados.placa?.existe && !errors.placa && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Esta placa ya está registrada por {duplicados.placa.usuario}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  La placa no se puede modificar
                </p>
              )}
            </div>

            {/* Rol*/}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rol <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  ref={rolRef}
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  disabled={isEditing}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${getBorderColor('rol')} ${isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="policia">Policía</option>
                  <option value="ambulancia">Ambulancia</option>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Info size={12} />
                  El rol no se puede modificar en edición
                </p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                formData.activo
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Usuario activo</p>
                  <p className="text-xs text-gray-500">
                    {formData.activo ? 'Puede iniciar sesión' : 'No puede iniciar sesión'}
                  </p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                !formData.activo
                  ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                  : formData.disponible
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
              }`}>
                <input
                  type="checkbox"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleChange}
                  disabled={!formData.activo}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Disponible</p>
                  <p className="text-xs text-gray-500">
                    {!formData.activo 
                      ? 'No disponible (usuario inactivo)'
                      : formData.disponible 
                        ? 'Puede recibir alertas' 
                        : 'Ocupado - No recibe alertas'}
                  </p>
                </div>
              </label>
            </div>
            
            {/* Mensaje informativo */}
            {!formData.activo && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Usuario inactivo</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Un usuario inactivo no puede estar disponible ni recibir alertas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/admin/personal')}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalForm;