import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Truck, MapPin, Save, X, ChevronLeft,
  Loader, Shield, Ambulance, Hash, FileText, Info
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

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing) {
      cargarUnidad();
    }
  }, [id]);

  const cargarUnidad = async () => {
    try {
      setCargandoDatos(true);
      console.log("📡 Cargando unidad ID:", id);
      const response = await unidadService.obtenerUnidad(id);
      console.log("✅ Datos recibidos:", response.data);

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

  const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  
  // Para coordenadas, solo permitir números y punto
  if (name === 'lat' || name === 'lng') {
    const valorLimpio = value.replace(/[^0-9.-]/g, '');
    setFormData(prev => ({ ...prev, [name]: valorLimpio }));
  } 
  // Si cambia el estado
  else if (name === 'estado') {
    // Estado disponible o ocupada → activa true
    // Estado inactiva → activa false
    setFormData(prev => ({
      ...prev,
      estado: value,
      activa: value !== 'inactiva' // disponible/ocupada = true, inactiva = false
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
      const datosAEnviar = {
        codigo: formData.codigo,
        tipo: formData.tipo,
        descripcion: formData.descripcion || '',
        // ✅ Si no hay coordenadas, enviar null (el backend usará valor por defecto)
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        estado: formData.estado,
        activa: formData.activa
      };

      console.log("📤 Enviando datos:", datosAEnviar);

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
          {/* Código */}
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
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  campoError === 'codigo'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                placeholder="Ej: UNI-001"
              />
            </div>
          </div>

          {/* Tipo */}
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
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 appearance-none bg-white ${
                  campoError === 'tipo'
                    ? 'border-red-500 bg-red-50 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
              >
                <option value="policia">Policía</option>
                <option value="ambulancia">Ambulancia</option>
              </select>
            </div>
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
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    campoError === 'lat'
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
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    campoError === 'lng'
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
                <option value="ocupada">Ocupada</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
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

export default UnidadForm;