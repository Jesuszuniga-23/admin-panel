import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  User, Mail, Phone, Shield, Hash, Save, X,
  ChevronLeft, AlertCircle, CheckCircle, Loader,
  AlertTriangle, Info, Lock, Clock,
  BadgeCheck, Activity, HelpCircle,
  ShieldUser, HandHeart, UserCog, UserMinus, Crown, Star, ShieldCheck, ShieldPlus
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';
import IconoEntidad, { BadgeIcono } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';
import useAuthStore from '../../../store/authStore';
import axiosInstance from '../../../services/api/axiosConfig';

// ✅ Función para obtener icono según rol (para preview)
const getIconoPorRolPreview = (rol, size = 20) => {
  const iconos = {
    operador_policial: { icon: ShieldUser, color: 'text-blue-600', bg: 'bg-blue-100' },
    operador_medico: { icon: HandHeart, color: 'text-green-600', bg: 'bg-green-100' },
    operador_tecnico: { icon: UserCog, color: 'text-purple-600', bg: 'bg-purple-100' },
    operador_general: { icon: UserMinus, color: 'text-gray-600', bg: 'bg-gray-100' },
    admin: { icon: Crown, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    superadmin: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
    policia: { icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    paramedico: { icon: ShieldPlus, color: 'text-green-600', bg: 'bg-green-100' }
  };

  const config = iconos[rol];
  if (config) {
    const IconComponent = config.icon;
    return {
      icono: <IconComponent size={size} className={config.color} />,
      bgColor: config.bg
    };
  }
  return {
    icono: <User size={size} className="text-gray-400" />,
    bgColor: 'bg-gray-100'
  };
};

// Mapeo de roles a entidades para iconos consistentes
const rolToEntidad = {
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  policia: 'POLICIA',
  paramedico: 'PARAMEDICO',
  operador_tecnico: 'OPERADOR_TECNICO',
  operador_policial: 'OPERADOR_POLICIAL',
  operador_medico: 'OPERADOR_MEDICO',
  operador_general: 'OPERADOR_GENERAL'
};

// Texto legible para roles
const rolTexto = {
  admin: 'Administrador',
  superadmin: 'Super Administrador',
  policia: 'Policía',
  paramedico: 'Paramédico',
  operador_tecnico: 'Operador Técnico',
  operador_policial: 'Operador Policial',
  operador_medico: 'Operador Médico',
  operador_general: 'Operador General'
};

// ✅ CORRECCIÓN: Roles disponibles según el rol del usuario
const rolesDisponiblesPorUsuario = {
  admin: [
    'admin',                          // Administradores
    'operador_tecnico',               // Operadores técnicos
    'operador_general',               // Operadores generales
    'operador_policial',              // Operadores policiales
    'operador_medico',                // Operadores médicos
    'policia',                        // Policías de campo
    'paramedico'                      // Paramédicos de campo
  ],
  superadmin: [
    'policia', 'paramedico', 'admin', 'superadmin',
    'operador_tecnico', 'operador_policial', 'operador_medico', 'operador_general'
  ],
  // ✅ CORREGIDO: Operador policial puede crear policías Y operadores policiales
  operador_policial: ['policia', 'operador_policial'],
  // ✅ CORREGIDO: Operador médico puede crear paramédicos Y operadores médicos
  operador_medico: ['paramedico', 'operador_medico'],
  operador_tecnico: [],
  operador_general: []
};

// Función para corregir caracteres mal codificados
const corregirTexto = (texto) => {
  if (!texto) return '';

  const correcciones = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã�': 'Á', 'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‘': 'Ñ',
    'Ã±': 'ñ', 'Â¿': '¿', 'Â¡': '¡',
    '£': 'ú', '¤': 'ñ', '€': 'é', '‚': 'é', '¢': 'ó'
  };

  let textoCorregido = texto;
  Object.entries(correcciones).forEach(([de, para]) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });

  return textoCorregido;
};

// Componente de barra de progreso
const ProgressBar = ({ completed, total }) => {
  const percentage = Math.min(100, Math.round((completed / total) * 100));

  return (
    <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600" />
          <span className="text-xs font-medium text-gray-600">Progreso del formulario</span>
        </div>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const PersonalForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const isEditing = !!id;
  const storageKey = isEditing ? `personal_form_edit_${id}` : 'personal_form_new';

  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(isEditing);

  const abortControllerRef = useRef(null);
  const abortControllerListaRef = useRef(null);

  const rolesPermitidos = rolesDisponiblesPorUsuario[currentUser?.rol] || [];

  const [formData, setFormData] = useState(() => {
    const savedData = sessionStorage.getItem(storageKey);
    if (savedData && !isEditing) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }

    return {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      email: '',
      telefono: '',
      placa: '',
      rol: rolesPermitidos[0] || 'policia',
      disponible: true,
      activo: true
    };
  });

  const [originalFormData, setOriginalFormData] = useState(null);
  const [errors, setErrors] = useState({
    nombre: '',
    apellido_paterno: '',
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
  const [touched, setTouched] = useState({});

  const [telefonoClicks, setTelefonoClicks] = useState(0);
  const [telefonoBloqueado, setTelefonoBloqueado] = useState(isEditing);
  const [ultimoClickTelefono, setUltimoClickTelefono] = useState(0);

  const nombreRef = useRef(null);
  const apellidoPaternoRef = useRef(null);
  const apellidoMaternoRef = useRef(null);
  const emailRef = useRef(null);
  const telefonoRef = useRef(null);
  const placaRef = useRef(null);
  const rolRef = useRef(null);

  const clickTimeoutRef = useRef(null);

  // Guardar estado original cuando se cargan los datos
  useEffect(() => {
    if (formData && !originalFormData && !cargandoDatos) {
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [formData, originalFormData, cargandoDatos]);
  useEffect(() => {
    const verificarLimites = async () => {
      try {
        const response = await axiosInstance.get('/admin/tenants/plan/limites');
        if (response.data.success) {
          const limites = response.data.data;
          const rolSeleccionado = formData.rol;
          const limiteRol = limites.roles[rolSeleccionado];

          if (limiteRol && limiteRol.limite > 0 && limiteRol.actual >= limiteRol.limite) {
            toast.error(`Has alcanzado el límite de ${rolSeleccionado} para tu plan. Considera actualizar a un plan superior.`);
          }
        }
      } catch (error) {
        console.error('Error verificando límites:', error);
      }
    };

    if (!isEditing) verificarLimites();
  }, [formData.rol, isEditing]);

  // Función para verificar si hay cambios
  const hasUnsavedChanges = () => {
    if (!originalFormData || isEditing) return false;

    const camposImportantes = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'telefono', 'placa', 'rol', 'activo', 'disponible'];

    for (let campo of camposImportantes) {
      if (formData[campo] !== originalFormData[campo]) {
        return true;
      }
    }
    return false;
  };

  // Emitir evento de cambios sin guardar
  useEffect(() => {
    const emitUnsavedStatus = () => {
      const hasChanges = hasUnsavedChanges() && !isEditing;
      const event = new CustomEvent('formUnsavedStatus', {
        detail: {
          hasUnsaved: hasChanges,
          isPersonalFormActive: true
        }
      });
      window.dispatchEvent(event);
    };

    emitUnsavedStatus();

    const interval = setInterval(emitUnsavedStatus, 500);
    return () => clearInterval(interval);
  }, [formData, originalFormData, isEditing]);

  // Limpiar estado cuando el componente se desmonta
  useEffect(() => {
    return () => {
      const event = new CustomEvent('formUnsavedStatus', {
        detail: {
          hasUnsaved: false,
          isPersonalFormActive: false
        }
      });
      window.dispatchEvent(event);
    };
  }, []);

  // Escuchar eventos del sidebar
  useEffect(() => {
    const handleSaveProgress = () => {
      if (!isEditing) {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
        toast.success('Progreso guardado', {
          icon: <Save size={18} className="text-green-600" />,
          duration: 2000
        });
      }
    };

    const handleDiscardProgress = () => {
      if (!isEditing) {
        sessionStorage.removeItem(storageKey);
        toast.success('Cambios descartados', {
          icon: <X size={18} className="text-red-600" />,
          duration: 1500
        });
      }
    };

    window.addEventListener('saveFormProgress', handleSaveProgress);
    window.addEventListener('discardFormProgress', handleDiscardProgress);

    return () => {
      window.removeEventListener('saveFormProgress', handleSaveProgress);
      window.removeEventListener('discardFormProgress', handleDiscardProgress);
    };
  }, [formData, isEditing, storageKey]);

  // Interceptar navegación con beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges() && !isEditing) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, originalFormData, isEditing]);

  // Función para limpiar progreso
  const limpiarProgreso = () => {
    sessionStorage.removeItem(storageKey);
  };

  // Cargar todos los personales con AbortController
  const cargarTodosPersonales = useCallback(async () => {
    if (abortControllerListaRef.current) {
      abortControllerListaRef.current.abort();
      console.log('🛑 Petición anterior cancelada en cargarTodosPersonales');
    }

    abortControllerListaRef.current = new AbortController();

    try {
      const response = await personalService.listarPersonal({
        limite: 1000,
        signal: abortControllerListaRef.current.signal
      });
      const personalesCorregidos = (response.data || []).map(p => ({
        ...p,
        nombre: corregirTexto(p.nombre),
        apellido_paterno: corregirTexto(p.apellido_paterno),
        apellido_materno: corregirTexto(p.apellido_materno)
      }));
      setTodosPersonales(personalesCorregidos);
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando personales:', error);
      }
    }
  }, []);

  // Cargar personal individual con AbortController
  const cargarPersonal = useCallback(async () => {
    if (!id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en cargarPersonal');
    }

    abortControllerRef.current = new AbortController();

    setCargandoDatos(true);
    try {
      const response = await personalService.obtenerPersonal(id, {
        signal: abortControllerRef.current.signal
      });

      const loadedData = {
        nombre: corregirTexto(response.data.nombre || ''),
        apellido_paterno: corregirTexto(response.data.apellido_paterno || ''),
        apellido_materno: corregirTexto(response.data.apellido_materno || ''),
        email: response.data.email || '',
        telefono: response.data.telefono || '',
        placa: response.data.placa || '',
        rol: response.data.rol || 'policia',
        activo: response.data.activo ?? true,
        disponible: response.data.activo ? (response.data.disponible ?? true) : false
      };

      setFormData(loadedData);
      setOriginalFormData(JSON.parse(JSON.stringify(loadedData)));
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error('Error cargando personal:', error);
        toast.error('Error al cargar los datos');
        navigate('/admin/personal');
      }
    } finally {
      setCargandoDatos(false);
    }
  }, [id, navigate]);

  // Efectos con limpieza
  useEffect(() => {
    cargarTodosPersonales();

    return () => {
      if (abortControllerListaRef.current) {
        abortControllerListaRef.current.abort();
        console.log('🛑 Petición de lista cancelada al desmontar');
      }
    };
  }, [cargarTodosPersonales]);

  useEffect(() => {
    if (isEditing) {
      cargarPersonal();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Petición de personal cancelada al desmontar');
      }
    };
  }, [isEditing, cargarPersonal]);

  useEffect(() => {
    setTelefonoBloqueado(isEditing);
    setTelefonoClicks(0);
  }, [isEditing]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges() && !isEditing) {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
        console.log('Auto-guardado realizado');
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [formData, isEditing, storageKey]);

  const handleTelefonoClick = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    if (!telefonoBloqueado) return;

    const ahora = Date.now();

    if (ahora - ultimoClickTelefono > 2000) {
      setTelefonoClicks(1);
    } else {
      setTelefonoClicks(prev => prev + 1);
    }
    setUltimoClickTelefono(ahora);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      setTelefonoClicks(0);
    }, 2000);

    const nuevosClicks = (ahora - ultimoClickTelefono > 2000) ? 1 : telefonoClicks + 1;

    if (nuevosClicks >= 3) {
      setTelefonoBloqueado(false);
      setTelefonoClicks(0);

      setTimeout(() => {
        if (telefonoRef.current) {
          telefonoRef.current.removeAttribute('readOnly');
          telefonoRef.current.focus();
        }
      }, 100);
    }
  };

  const validarCampo = (name, value) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value.trim()) error = 'El nombre es obligatorio';
        else if (value.length < 2) error = 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'apellido_paterno':
        if (!value.trim()) error = 'El apellido paterno es obligatorio';
        else if (value.length < 2) error = 'El apellido paterno debe tener al menos 2 caracteres';
        break;
      case 'email':
        if (!value.trim()) error = 'El email es obligatorio';
        else if (!value.includes('@') || !value.includes('.')) error = 'El email no es válido';
        break;
      case 'telefono':
        if (value && value.length !== 10) error = 'El teléfono debe tener 10 dígitos';
        break;
      case 'placa':
        if (!value.trim()) error = 'La placa es obligatoria';
        else if (value.length < 3) error = 'La placa debe tener al menos 3 caracteres';
        break;
      default: break;
    }
    return error;
  };

  const verificarDuplicado = (campo, valor) => {
    if (!valor || (isEditing && campo === 'email')) {
      setDuplicados(prev => ({ ...prev, [campo]: null }));
      return;
    }

    const otrosPersonales = todosPersonales.filter(p =>
      (isEditing ? p.id !== parseInt(id) : true) && p.activo === true
    );

    let duplicado = null;

    switch (campo) {
      case 'email':
        duplicado = otrosPersonales.find(p => p.email?.toLowerCase() === valor.toLowerCase());
        break;
      case 'telefono':
        duplicado = otrosPersonales.find(p => p.telefono === valor);
        break;
      case 'placa':
        duplicado = otrosPersonales.find(p => p.placa?.toLowerCase() === valor.toLowerCase());
        break;
    }

    setDuplicados(prev => ({
      ...prev,
      [campo]: duplicado ? { existe: true, usuario: duplicado.nombre } : null
    }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (isEditing) {
      if (name === 'telefono' && telefonoBloqueado) return;
      if ((name === 'placa' || name === 'email' || name === 'rol')) {
        toast.error('Este campo no se puede modificar', {
          duration: 2000,
          icon: <Lock size={18} className="text-yellow-600" />
        });
        return;
      }
    }

    setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setFormData(prev => ({ ...prev, telefono: soloNumeros }));
        const error = validarCampo(name, soloNumeros);
        setErrors(prev => ({ ...prev, [name]: error }));
        verificarDuplicado(name, soloNumeros);
      }
    }
    else if (name === 'nombre' || name === 'apellido_paterno' || name === 'apellido_materno') {
      const valorLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: valorLimpio }));
      const error = validarCampo(name, valorLimpio);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    else if (name === 'placa' && !isEditing) {
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
        setFormData(prev => ({ ...prev, activo: false, disponible: false }));
      } else {
        setFormData(prev => ({ ...prev, activo: true, disponible: true }));
      }
    }
    else if (name === 'disponible' && formData.activo) {
      setFormData(prev => ({ ...prev, disponible: checked }));
    }
    else if (name === 'rol' && !isEditing) {
      setFormData(prev => ({ ...prev, rol: value }));
    }
  };

  const calcularProgreso = () => {
    const camposRequeridos = ['nombre', 'apellido_paterno', 'email', 'placa'];
    const completados = camposRequeridos.filter(campo =>
      formData[campo] && formData[campo].trim() !== ''
    ).length;
    return completados;
  };

  const getBorderColor = (campo) => {
    if (errors[campo]) return 'border-red-300 bg-red-50';
    if (duplicados[campo]?.existe) return 'border-yellow-300 bg-yellow-50';
    if (touched[campo] && formData[campo] && !errors[campo]) return 'border-green-300 bg-green-50';
    return 'border-gray-200';
  };

  const isFieldDisabled = (campo) => {
    if (!isEditing) return false;
    switch (campo) {
      case 'email': case 'placa': case 'rol': return true;
      case 'telefono': return telefonoBloqueado;
      default: return false;
    }
  };

  const getClicksRestantes = () => {
    if (!isEditing || !telefonoBloqueado) return null;
    const restantes = 3 - telefonoClicks;
    return restantes > 0 ? `${restantes} clic${restantes !== 1 ? 's' : ''} restantes` : '¡Ya puedes editar!';
  };

  const getRolPreview = () => {
    const entidad = rolToEntidad[formData.rol] || 'ADMIN';
    const texto = rolTexto[formData.rol] || formData.rol;
    const iconoPreview = getIconoPorRolPreview(formData.rol, 18);
    return { entidad, texto, icono: iconoPreview.icono };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && !authService.puedeCrearPersonal(formData.rol)) {
      toast.error(`No tienes permisos para crear personal con rol: ${rolTexto[formData.rol] || formData.rol}`);
      return;
    }

    if (isEditing && !authService.puedeEditarPersonal(formData.rol)) {
      toast.error(`No tienes permisos para editar este personal`);
      return;
    }

    const newErrors = {
      nombre: validarCampo('nombre', formData.nombre),
      apellido_paterno: validarCampo('apellido_paterno', formData.apellido_paterno),
      email: validarCampo('email', formData.email),
      telefono: validarCampo('telefono', formData.telefono),
      placa: validarCampo('placa', formData.placa),
      rol: ''
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(error => error !== '');
    if (hasErrors) {
      if (newErrors.nombre) {
        nombreRef.current?.focus();
      } else if (newErrors.apellido_paterno) {
        apellidoPaternoRef.current?.focus();
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
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno || null,
        email: formData.email,
        telefono: formData.telefono,
        placa: formData.placa,
        rol: formData.rol,
        activo: formData.activo,
        disponible: formData.disponible
      };

      console.log("Enviando datos al back:", datosAEnviar);

      if (isEditing) {
        await personalService.actualizarPersonal(id, datosAEnviar);
        toast.success('Personal actualizado correctamente');
      } else {
        await personalService.crearPersonal(datosAEnviar);
        toast.success('Personal creado correctamente');
        limpiarProgreso();
      }

      navigate('/admin/personal');
    } catch (error) {
      console.error('Error guardando personal:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (originalFormData && !isEditing) {
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
    }

    if (!isEditing) limpiarProgreso();

    const event = new CustomEvent('formUnsavedStatus', {
      detail: {
        hasUnsaved: false,
        isPersonalFormActive: false
      }
    });
    window.dispatchEvent(event);

    navigate('/admin/personal');
  };

  const rolPreview = getRolPreview();

  if (cargandoDatos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-500">Cargando datos del personal...</p>
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
              onClick={handleCancel}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {isEditing ? 'Editar Personal' : 'Nuevo Personal'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? `Editando ID: ${id}` : 'Ingresa los datos del nuevo miembro del equipo'}
              </p>
            </div>
          </div>

          {!isEditing && hasUnsavedChanges() && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle size={14} className="text-amber-600" />
              <span className="text-xs text-amber-700">Cambios sin guardar</span>
            </div>
          )}
        </div>

        {!isEditing && <ProgressBar completed={calcularProgreso()} total={4} />}

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="space-y-8">
              {/* SECCIÓN 1: Información personal */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Información personal</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-auto">
                    Datos básicos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Nombre(s) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={nombreRef}
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        onBlur={() => handleBlur('nombre')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('nombre')} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Ej: José"
                        maxLength={50}
                      />
                    </div>
                    {errors.nombre && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Apellido paterno <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={apellidoPaternoRef}
                        type="text"
                        name="apellido_paterno"
                        value={formData.apellido_paterno}
                        onChange={handleChange}
                        onBlur={() => handleBlur('apellido_paterno')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('apellido_paterno')} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Ej: Martínez"
                        maxLength={50}
                      />
                    </div>
                    {errors.apellido_paterno && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.apellido_paterno}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Apellido materno
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={apellidoMaternoRef}
                        type="text"
                        name="apellido_materno"
                        value={formData.apellido_materno}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Ej: García (opcional)"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Contacto */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Contacto</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={emailRef}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur('email')}
                        disabled={isFieldDisabled('email')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('email')} ${isFieldDisabled('email') ? 'bg-gray-100 cursor-not-allowed' : ''} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                    {duplicados.email?.existe && !errors.email && (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Registrado por {duplicados.email.usuario}
                      </p>
                    )}
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Info size={12} /> No se puede modificar
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Teléfono
                      {isEditing && telefonoBloqueado && (
                        <span className="ml-2 text-amber-600 font-normal">({getClicksRestantes()})</span>
                      )}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={telefonoRef}
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onClick={handleTelefonoClick}
                        onChange={handleChange}
                        onBlur={() => handleBlur('telefono')}
                        readOnly={isFieldDisabled('telefono')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${getBorderColor('telefono')} ${isFieldDisabled('telefono') ? 'bg-gray-50 cursor-pointer select-none' : ''} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="2384587196"
                        maxLength={10}
                      />
                    </div>
                    {errors.telefono && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.telefono}
                      </p>
                    )}
                    {duplicados.telefono?.existe && !errors.telefono && formData.telefono.length === 10 && (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Registrado por {duplicados.telefono.usuario}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Identificación */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BadgeCheck size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Identificación</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Placa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={placaRef}
                        type="text"
                        name="placa"
                        value={formData.placa}
                        onChange={handleChange}
                        onBlur={() => handleBlur('placa')}
                        disabled={isFieldDisabled('placa')}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all uppercase ${getBorderColor('placa')} ${isFieldDisabled('placa') ? 'bg-gray-100 cursor-not-allowed' : ''} focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="P-001"
                        maxLength={10}
                      />
                    </div>
                    {errors.placa && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.placa}
                      </p>
                    )}
                    {duplicados.placa?.existe && !errors.placa && (
                      <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Registrada por {duplicados.placa.usuario}
                      </p>
                    )}
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Info size={12} /> No se puede modificar
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Rol <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        {rolPreview.icono}
                      </div>
                      <select
                        ref={rolRef}
                        name="rol"
                        value={formData.rol}
                        onChange={handleChange}
                        disabled={isEditing || rolesPermitidos.length === 0}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${getBorderColor('rol')} ${(isEditing || rolesPermitidos.length === 0) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} focus:ring-blue-500 focus:border-blue-500`}
                      >
                        {rolesPermitidos.map(rol => (
                          <option key={rol} value={rol}>{rolTexto[rol] || rol}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2">
                      <BadgeIcono entidad={rolPreview.entidad} texto={rolPreview.texto} size={12} />
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Info size={12} /> No se puede modificar
                      </p>
                    )}
                    {!isEditing && rolesPermitidos.length === 0 && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> No tienes permisos para crear personal
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: Estado */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Activity size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Estado</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.activo ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
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

                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${!formData.activo ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' :
                    formData.disponible ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
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
                        {!formData.activo ? 'No disponible' : formData.disponible ? 'Puede recibir alertas' : 'Ocupado'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {!formData.activo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Usuario inactivo</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Los usuarios inactivos no pueden estar disponibles ni recibir alertas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <X size={18} /> Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!isEditing && rolesPermitidos.length === 0)}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-200"
              >
                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </div>

        {!isEditing && formData.nombre && (
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
            <Clock size={12} className="animate-pulse" />
            <span>Guardado automático cada 30 segundos • Los datos se conservan si cierras la página</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalForm;