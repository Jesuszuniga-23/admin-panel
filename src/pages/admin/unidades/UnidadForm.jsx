import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Truck, Save, X, ChevronLeft,
  Loader, Shield, Ambulance, Hash, FileText, Info,
  AlertCircle, CheckCircle, XCircle, Clock,
  Power, MapPin, BookOpen, Wrench,
  Layers, Activity
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import toast from 'react-hot-toast';

// Componente de barra de progreso - VERSIÓN SOBRIA
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

const UnidadForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const storageKey = isEditing ? `unidad_form_edit_${id}` : 'unidad_form_new';

  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(isEditing);
  const [campoError, setCampoError] = useState('');
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [codigoValido, setCodigoValido] = useState(true);
  const [codigoMensaje, setCodigoMensaje] = useState('');
  const [touched, setTouched] = useState({});

  // RECUPERAR DATOS GUARDADOS
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
      codigo: '',
      tipo: 'policia',
      descripcion: '',
      estado: 'disponible',
      activa: true
    };
  });

  // Refs para enfoque
  const codigoRef = useRef();
  const tipoRef = useRef();
  const descripcionRef = useRef();

  // Timeout para debounce de validación
  const debounceTimeout = useRef(null);

  // GUARDAR DATOS AUTOMÁTICAMENTE
  useEffect(() => {
    if (!isEditing && !cargandoDatos) {
      sessionStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, isEditing, cargandoDatos]);

  // Limpiar storage al enviar
  const limpiarStorage = () => {
    sessionStorage.removeItem(storageKey);
  };

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      cargarUnidad();
    }
  }, [id]);

  const cargarUnidad = async () => {
    try {
      setCargandoDatos(true);
      console.log("Cargando unidad ID:", id);
      const response = await unidadService.obtenerUnidad(id);
      console.log("Datos recibidos:", response.data);

      setFormData({
        codigo: response.data.codigo || '',
        tipo: response.data.tipo || 'policia',
        descripcion: response.data.descripcion || '',
        estado: response.data.estado || 'disponible',
        activa: response.data.activa ?? true
      });
    } catch (error) {
      console.error('Error cargando unidad:', error);
      toast.error('Error al cargar los datos');
      navigate('/admin/unidades');
    } finally {
      setCargandoDatos(false);
    }
  };

  // VALIDAR CÓDIGO ÚNICO EN TIEMPO REAL
  const validarCodigoUnico = async (codigo) => {
    if (!codigo || codigo.length < 3) {
      setCodigoValido(false);
      setCodigoMensaje('El código debe tener al menos 3 caracteres');
      return;
    }

    try {
      setVerificandoCodigo(true);
      
      const response = await unidadService.listarUnidades({ 
        search: codigo,
        limite: 1000
      });

      console.log('Respuesta validación código:', response);

      const existe = response.data?.some(u => 
        u.codigo?.toLowerCase() === codigo.toLowerCase() && 
        (isEditing ? u.id !== parseInt(id) : true)
      );

      if (existe) {
        setCodigoValido(false);
        setCodigoMensaje(
          <span className="flex items-center gap-1">
            <XCircle size={14} className="text-red-500" />
            Este código ya está registrado por otra unidad
          </span>
        );
      } else {
        setCodigoValido(true);
        setCodigoMensaje(
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-green-500" />
            Código disponible
          </span>
        );
      }
    } catch (error) {
      console.error('Error verificando código:', error);
      setCodigoValido(false);
      setCodigoMensaje('Error al verificar código');
      
      if (error.response?.status === 500) {
        toast.error('Error en el servidor al verificar código');
      } else {
        toast.error(error.error || 'Error al verificar código');
      }
    } finally {
      setVerificandoCodigo(false);
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const calcularProgreso = () => {
    let completados = 0;
    if (formData.codigo && formData.codigo.length >= 3) completados++;
    if (formData.tipo) completados++;
    if (formData.estado) completados++;
    return completados;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'codigo') {
      const valorLimpio = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setFormData(prev => ({ ...prev, codigo: valorLimpio }));

      if (!isEditing) {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
          if (valorLimpio.length >= 3) {
            validarCodigoUnico(valorLimpio);
          } else {
            setCodigoValido(false);
            setCodigoMensaje(valorLimpio.length === 0 ? '' : 'El código debe tener al menos 3 caracteres');
          }
        }, 500);
      }
    }
    else if (name === 'estado') {
      setFormData(prev => ({
        ...prev,
        estado: value,
        activa: value !== 'inactiva'
      }));
    }
    else if (name === 'activa') {
      setFormData(prev => ({
        ...prev,
        activa: checked,
        estado: checked ? 'disponible' : 'inactiva'
      }));
    }
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
      if (!isEditing && !codigoValido) {
        toast.error('El código no está disponible o es inválido');
        setCampoError('codigo');
        codigoRef.current?.focus();
        setLoading(false);
        return;
      }

      if (formData.estado === 'ocupada') {
        toast.error('No se puede crear/editar una unidad con estado OCUPADA');
        setCampoError('estado');
        setLoading(false);
        return;
      }

      const datosAEnviar = {
        codigo: formData.codigo,
        tipo: formData.tipo,
        descripcion: formData.descripcion || '',
        estado: formData.estado,
        activa: formData.activa
      };

      console.log("Enviando datos:", datosAEnviar);

      if (isEditing) {
        await unidadService.actualizarUnidad(id, datosAEnviar);
        toast.success('Unidad actualizada correctamente');
      } else {
        await unidadService.crearUnidad(datosAEnviar);
        toast.success('Unidad creada correctamente');
        limpiarStorage();
      }

      navigate('/admin/unidades');
    } catch (error) {
      console.error('Error guardando unidad:', error);
      toast.error(error.error || error.message || 'Error al guardar');
      
      if (error.message?.includes('código') || error.error?.includes('código')) {
        setCampoError('codigo');
        codigoRef.current?.focus();
      } else if (error.message?.includes('tipo') || error.error?.includes('tipo')) {
        setCampoError('tipo');
        tipoRef.current?.focus();
      }
      
      setTimeout(() => setCampoError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getBorderColor = (campo) => {
    if (campoError === campo) return 'border-red-300 bg-red-50';
    if (campo === 'codigo' && !isEditing && touched.codigo && formData.codigo && formData.codigo.length >= 3) {
      return codigoValido ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50';
    }
    return 'border-gray-200';
  };

  if (cargandoDatos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Loader size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando datos de la unidad...</p>
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
              onClick={() => {
                if (!isEditing) limpiarStorage();
                navigate('/admin/unidades');
              }}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                {isEditing ? 'Editar Unidad' : 'Nueva Unidad'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? `Editando unidad: ${formData.codigo}`
                  : 'Ingresa los datos de la nueva unidad'}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso (solo para creación) */}
        {!isEditing && (
          <ProgressBar 
            completed={calcularProgreso()} 
            total={3} 
          />
        )}

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Cabecera decorativa - COLORES SOBRIOS */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="space-y-8">
              {/* SECCIÓN 1: Identificación */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Truck size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Identificación de la unidad</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-auto">
                    Datos principales
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Código de unidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        ref={codigoRef}
                        type="text"
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleChange}
                        onBlur={() => handleBlur('codigo')}
                        readOnly={isEditing}
                        required
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          getBorderColor('codigo')
                        } ${
                          isEditing
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="Ej: UNI-001"
                      />
                    </div>

                    {/* Indicador de validación de código */}
                    {!isEditing && formData.codigo && formData.codigo.length >= 3 && (
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        {verificandoCodigo ? (
                          <>
                            <Loader size={12} className="animate-spin text-blue-600" />
                            <span className="text-gray-500">Verificando disponibilidad...</span>
                          </>
                        ) : (
                          <>
                            {codigoValido ? (
                              <CheckCircle size={12} className="text-green-600" />
                            ) : (
                              <AlertCircle size={12} className="text-red-600" />
                            )}
                            <span className={codigoValido ? 'text-green-600' : 'text-red-600'}>
                              {codigoMensaje}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Info size={12} />
                        El código no se puede modificar
                      </p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tipo de unidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {formData.tipo === 'policia' ? (
                        <Shield size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      ) : (
                        <Ambulance size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      )}
                      <select
                        ref={tipoRef}
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        disabled={isEditing}
                        required
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${
                          campoError === 'tipo'
                            ? 'border-red-300 bg-red-50 focus:ring-red-500'
                            : isEditing
                              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                              : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                        }`}
                      >
                        <option value="policia">Policía</option>
                        <option value="ambulancia">Ambulancia</option>
                      </select>
                    </div>
                    {isEditing && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Info size={12} />
                        El tipo no se puede modificar
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Descripción */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Descripción</h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Descripción adicional
                  </label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      ref={descripcionRef}
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Descripción adicional de la unidad (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Estado operativo */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Activity size={18} className="text-gray-700" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-700">Estado operativo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Estado inicial */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Estado inicial
                    </label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="inactiva">Inactiva</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Info size={12} />
                      "Ocupada" se asigna automáticamente durante una alerta
                    </p>
                  </div>

                  {/* Checkbox activa */}
                  <div className="flex items-center pt-8">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer w-full ${
                      formData.activa
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <input
                        type="checkbox"
                        name="activa"
                        checked={formData.activa}
                        onChange={handleChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Unidad activa</p>
                        <p className="text-xs text-gray-500">
                          {formData.activa ? 'Puede recibir alertas' : 'No operativa'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Relación Estado-Activa - VERSIÓN SOBRIA */}
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Relación Estado-Activa</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Si seleccionas "Disponible", la unidad estará activa. Si seleccionas "Inactiva", se desmarcará automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  if (!isEditing) limpiarStorage();
                  navigate('/admin/unidades');
                }}
                className="group px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <X size={18} className="text-gray-500 group-hover:text-gray-700" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (!isEditing && !codigoValido)}
                className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-200"
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

        {/* Indicador de guardado automático (solo para creación) */}
        {!isEditing && formData.codigo && (
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
            <Clock size={12} className="animate-pulse" />
            <span>Guardado automático • Los datos se conservan si cambias de página</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnidadForm;