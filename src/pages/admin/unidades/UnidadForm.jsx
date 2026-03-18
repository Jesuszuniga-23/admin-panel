import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Truck, MapPin, Save, X, ChevronLeft,
  Loader, Shield, Ambulance, Hash, FileText, Info,
  AlertCircle, CheckCircle
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import toast from 'react-hot-toast';

const UnidadForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(isEditing);
  const [campoError, setCampoError] = useState('');
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [codigoValido, setCodigoValido] = useState(true);
  const [codigoMensaje, setCodigoMensaje] = useState('');

  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'policia',
    descripcion: '',
    lat: '',
    lng: '',
    estado: 'disponible',
    activa: true
  });

  // Refs para enfoque
  const codigoRef = useRef();
  const tipoRef = useRef();
  const latRef = useRef();
  const lngRef = useRef();

  // Timeout para debounce de validación
  const debounceTimeout = useRef(null);

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
        lat: response.data.lat || '',
        lng: response.data.lng || '',
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
      // Llamar al backend para verificar si el código existe
      const response = await unidadService.listarUnidades({ search: codigo, limite: 1 });

      const existe = response.data?.some(u =>
        u.codigo.toLowerCase() === codigo.toLowerCase()
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
    } finally {
      setVerificandoCodigo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Para coordenadas, solo permitir números y punto
    if (name === 'lat' || name === 'lng') {
      const valorLimpio = value.replace(/[^0-9.-]/g, '');
      setFormData(prev => ({ ...prev, [name]: valorLimpio }));
    }
    // Para código - validar en tiempo real (solo en creación)
    else if (name === 'codigo') {
      const valorLimpio = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      setFormData(prev => ({ ...prev, codigo: valorLimpio }));

      if (!isEditing) {
        // Limpiar timeout anterior
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }

        // Nuevo timeout para validar después de 500ms
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
    // Si cambia el estado
    else if (name === 'estado') {
      // Estado disponible → activa true
      // Estado inactiva → activa false
      // Estado ocupada NO está disponible en el formulario
      setFormData(prev => ({
        ...prev,
        estado: value,
        activa: value !== 'inactiva' // disponible = true, inactiva = false
      }));
    }
    // Si cambia activa (checkbox)
    else if (name === 'activa') {
      setFormData(prev => ({
        ...prev,
        activa: checked,
        estado: checked ? 'disponible' : 'inactiva' // Si activa, poner disponible
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
      
      // VALIDACIONES ANTES DE ENVIAR
      

      // Validar código único (solo en creación)
      if (!isEditing && !codigoValido) {
        toast.error('El código no está disponible o es inválido');
        setCampoError('codigo');
        codigoRef.current?.focus();
        setLoading(false);
        return;
      }

      // Validar que el estado no sea ocupada
      if (formData.estado === 'ocupada') {
        toast.error('No se puede crear/editar una unidad con estado OCUPADA. Este estado es solo para alertas activas.');
        setCampoError('estado');
        setLoading(false);
        return;
      }

      const datosAEnviar = {
        codigo: formData.codigo,
        tipo: formData.tipo,
        descripcion: formData.descripcion || '',
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        estado: formData.estado,
        activa: formData.activa
      };

      console.log(" Enviando datos:", datosAEnviar);

      if (isEditing) {
        await unidadService.actualizarUnidad(id, datosAEnviar);
        toast.success('Unidad actualizada correctamente');
      } else {
        await unidadService.crearUnidad(datosAEnviar);
        toast.success('Unidad creada correctamente');
      }

      navigate('/admin/unidades');
    } catch (error) {
      console.error('Error guardando unidad:', error);

      const mensajeError = error.error || error.message || '';
      toast.error(mensajeError || 'Error al guardar');

      // Enfocar según el error
      if (mensajeError.includes('código') || mensajeError.includes('codigo')) {
        setCampoError('codigo');
        codigoRef.current?.focus();
      } else if (mensajeError.includes('tipo')) {
        setCampoError('tipo');
        tipoRef.current?.focus();
      } else if (mensajeError.includes('lat')) {
        setCampoError('lat');
        latRef.current?.focus();
      } else if (mensajeError.includes('lng')) {
        setCampoError('lng');
        lngRef.current?.focus();
      }

      setTimeout(() => setCampoError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando datos de la unidad...</p>
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
            onClick={() => navigate('/admin/unidades')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
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

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
        <div className="space-y-6">
          {/* Código - SOLO LECTURA EN EDICIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de unidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={codigoRef}
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                readOnly={isEditing} // ← BLOQUEADO EN EDICIÓN
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${campoError === 'codigo'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : isEditing
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      : 'border-gray-200 focus:ring-blue-500'
                  }`}
                placeholder="Ej: UNI-001"
              />
            </div>

            {/* Indicador de validación de código (solo en creación) */}
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
              <p className="text-xs text-gray-400 mt-2">
                El código no se puede modificar después de crear la unidad
              </p>
            )}
          </div>

          {/* Tipo - SOLO LECTURA EN EDICIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de unidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Truck size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                ref={tipoRef}
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                disabled={isEditing} // ← BLOQUEADO EN EDICIÓN
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 appearance-none ${campoError === 'tipo'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : isEditing
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      : 'border-gray-200 focus:ring-blue-500 bg-white'
                  }`}
              >
                <option value="policia">Policía</option>
                <option value="ambulancia">Ambulancia</option>
              </select>
            </div>
            {isEditing && (
              <p className="text-xs text-gray-400 mt-2">
                El tipo no se puede modificar después de crear la unidad
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción adicional de la unidad"
              />
            </div>
          </div>

          {/* Coordenadas - AHORA OPCIONALES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitud <span className="text-gray-400">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={latRef}
                  type="text"
                  name="lat"
                  value={formData.lat}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${campoError === 'lat'
                      ? 'border-red-500 bg-red-50 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  placeholder="Ej: 18.8667 (opcional)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud <span className="text-gray-400">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={lngRef}
                  type="text"
                  name="lng"
                  value={formData.lng}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${campoError === 'lng'
                      ? 'border-red-500 bg-red-50 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-blue-500'
                    }`}
                  placeholder="Ej: -97.1533 (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Mensaje informativo */}
          {!formData.lat && !formData.lng && (
            <p className="text-xs text-blue-600 -mt-2 flex items-center gap-1">
              <Info size={14} />
              Si no proporcionas coordenadas, se usará la ubicación por defecto
            </p>
          )}

          {/* Estado y Activa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado inicial
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="disponible">Disponible</option>
                <option value="inactiva">Inactiva</option>
                {/* OCUPADA NO ESTÁ DISPONIBLE EN EL FORMULARIO */}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Nota: El estado "Ocupada" solo se asigna automáticamente durante una alerta activa
              </p>
            </div>

            <div className="flex items-center pt-8">
              <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${formData.activa ? 'bg-blue-50' : 'bg-gray-50'
                }`}>
                <input
                  type="checkbox"
                  name="activa"
                  checked={formData.activa}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Unidad activa</span>
              </label>
            </div>
          </div>

          {/* Relación Estado-Activa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 flex items-center gap-1">
              <Info size={14} />
              <strong>Relación Estado-Activa:</strong> Si seleccionas "Disponible", la unidad estará activa.
              Si seleccionas "Inactiva", se desmarcará automáticamente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/unidades')}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!isEditing && !codigoValido)}
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

export default UnidadForm;