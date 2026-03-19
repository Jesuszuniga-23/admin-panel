import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Truck, MapPin, Hash, Edit, Trash2, Power,
  ChevronLeft, Loader, AlertCircle, Users,
  Shield, Ambulance, Calendar, User, Mail, Phone,
  X, Check, Plus, FileText, UserMinus, UserPlus,
  Clock, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';

// FUNCIÓN PARA CORREGIR CARACTERES MAL CODIFICADOS
const corregirTexto = (texto) => {
  if (!texto) return '';

  const correcciones = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã�': 'Á', 'Ã‰': 'É', 'Ã�': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
    'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Â¿': '¿', 'Â¡': '¡',
    '£': 'ú', '¤': 'ñ', '€': 'é', '‚': 'é', '¢': 'ó',
    'Ram¡rez': 'Ramírez', 'Z£¤iga': 'Zúñiga', 'L¢pez': 'López',
    'Jes£s': 'Jesús', 'Param‚dico': 'Paramédico'
  };

  let textoCorregido = texto;
  Object.entries(correcciones).forEach(([de, para]) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });

  return textoCorregido;
};

// MODAL PARA ACCIONES NO PERMITIDAS
const ModalAccionNoPermitida = ({ isOpen, onClose, mensaje }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Acción no permitida</h3>
          </div>

          <p className="text-sm text-gray-600 mb-6">{mensaje}</p>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// MODAL DE CONFIRMACIÓN PERSONALIZADO
const ModalConfirmacion = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo, 
  mensaje, 
  itemNombre,
  tipoAccion = 'eliminar' 
}) => {
  if (!isOpen) return null;

  const config = {
    eliminar: {
      icon: <Trash2 size={24} className="text-red-600" />,
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      buttonText: 'Eliminar',
      mensajeAdicional: 'Esta acción no se puede deshacer.'
    },
    desactivar: {
      icon: <Power size={24} className="text-yellow-600" />,
      bgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      buttonText: 'Desactivar',
      mensajeAdicional: 'La unidad dejará de estar operativa.'
    },
    activar: {
      icon: <Power size={24} className="text-green-600" />,
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      buttonText: 'Activar',
      mensajeAdicional: 'La unidad volverá a estar operativa.'
    },
    remover: {
      icon: <UserMinus size={24} className="text-orange-600" />,
      bgColor: 'bg-orange-100',
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
      buttonText: 'Remover',
      mensajeAdicional: 'El personal será removido de esta unidad.'
    }
  };

  const conf = config[tipoAccion] || config.eliminar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 ${conf.bgColor} rounded-full flex items-center justify-center`}>
              {conf.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {mensaje}
          </p>
          {itemNombre && (
            <p className="text-base font-semibold text-center p-3 rounded-lg mb-4" style={{
              color: tipoAccion === 'eliminar' ? '#dc2626' : 
                     tipoAccion === 'desactivar' ? '#d97706' : 
                     tipoAccion === 'activar' ? '#059669' : 
                     '#ea580c',
              backgroundColor: tipoAccion === 'eliminar' ? '#fee2e2' : 
                             tipoAccion === 'desactivar' ? '#fef3c7' : 
                             tipoAccion === 'activar' ? '#d1fae5' : 
                             '#ffedd5'
            }}>
              "{itemNombre}"
            </p>
          )}
          <p className="text-xs text-gray-400 mb-6">{conf.mensajeAdicional}</p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 ${conf.buttonColor} text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2`}
            >
              {conf.icon}
              {conf.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnidadDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [unidad, setUnidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personalDisponible, setPersonalDisponible] = useState([]);
  const [mostrarAsignacion, setMostrarAsignacion] = useState(false);
  const [personalSeleccionado, setPersonalSeleccionado] = useState('');
  const [cargandoPersonal, setCargandoPersonal] = useState(false);
  
  // Estados para modales
  const [modalInfo, setModalInfo] = useState({
    show: false,
    mensaje: ''
  });
  
  const [modalConfirmacion, setModalConfirmacion] = useState({
    show: false,
    tipo: '',
    titulo: '',
    mensaje: '',
    itemNombre: '',
    onConfirm: null
  });

  useEffect(() => {
    cargarUnidad();
  }, [id]);

  // CARGA UNIDAD Y CORRIGE TEXTOS
  const cargarUnidad = async () => {
    try {
      setLoading(true);
      const response = await unidadService.obtenerUnidad(id);

      const dataCorregida = {
        ...response.data,
        creador: response.data.creador ? {
          ...response.data.creador,
          nombre: corregirTexto(response.data.creador.nombre)
        } : null,
        actualizador: response.data.actualizador ? {
          ...response.data.actualizador,
          nombre: corregirTexto(response.data.actualizador.nombre)
        } : null,
        personal_asignado: response.data.personal_asignado?.map(p => ({
          ...p,
          nombre: corregirTexto(p.nombre)
        })) || []
      };

      setUnidad(dataCorregida);
    } catch (error) {
      console.error("Error cargando unidad:", error);
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        }); setTimeout(() => cargarUnidad(), 5000);
      } else {
        setError(error.error || 'Error al cargar los datos');
        toast.error('No se pudo cargar la información');
      }
    } finally {
      setLoading(false);
    }
  };

  // CARGA PERSONAL DISPONIBLE Y CORRIGE TEXTOS
  const cargarPersonalDisponible = async () => {
    try {
      setCargandoPersonal(true);
      const response = await unidadService.personalDisponible(id, unidad?.tipo);

      const personalCorregido = (response.data || []).map(p => ({
        ...p,
        nombre: corregirTexto(p.nombre)
      }));

      setPersonalDisponible(personalCorregido);
      setMostrarAsignacion(true);
    } catch (error) {
      console.error("Error cargando personal disponible:", error);
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error('Error al cargar personal disponible');
      }
    } finally {
      setCargandoPersonal(false);
    }
  };

  const handleAsignar = async () => {
    if (!personalSeleccionado) {
      toast.error('Selecciona un personal');
      return;
    }

    try {
      await unidadService.asignarPersonal(id, personalSeleccionado);
      toast.success('Personal asignado correctamente', {
        icon: <UserPlus size={18} className="text-green-500" />
      });
      setMostrarAsignacion(false);
      setPersonalSeleccionado('');
      await cargarUnidad();
    } catch (error) {
      console.error("Error asignando personal:", error);
      if (error.response?.status === 429) {
        toast.error('Demasiadas peticiones. Espera unos segundos...', {
          icon: <Clock size={18} className="text-yellow-500" />
        });
      } else {
        toast.error(error.error || 'Error al asignar personal');
      }
    }
  };

  // REMOVER PERSONAL CON VALIDACIÓN DE UNIDAD OCUPADA
  const handleRemover = async (personalId, nombre) => {
    // Validar si la unidad está ocupada
    if (unidad.estado === 'ocupada') {
      setModalInfo({
        show: true,
        mensaje: `No es posible remover personal de la unidad mientras se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    const nombreCorregido = corregirTexto(nombre);
    
    // Abrir modal de confirmación para remover
    setModalConfirmacion({
      show: true,
      tipo: 'remover',
      titulo: 'Confirmar remoción',
      mensaje: `¿Estás seguro de remover a ${nombreCorregido} de esta unidad?`,
      itemNombre: nombreCorregido,
      onConfirm: async () => {
        try {
          await unidadService.removerPersonal(id, personalId);
          toast.success('Personal removido correctamente', {
            icon: <UserMinus size={18} className="text-green-500" />
          });
          await cargarUnidad();
        } catch (error) {
          console.error("Error removiendo personal:", error);
          if (error.response?.status === 429) {
            toast.error('Demasiadas peticiones. Espera unos segundos...', {
              icon: <Clock size={18} className="text-yellow-500" />
            });
          } else {
            toast.error(error.error || 'Error al remover personal');
          }
        }
      }
    });
  };

  // TOGGLE ACTIVA CON VALIDACIÓN DE UNIDAD OCUPADA
  const handleToggleActiva = async () => {
    // Validar si la unidad está ocupada
    if (unidad.estado === 'ocupada') {
      setModalInfo({
        show: true,
        mensaje: `No es posible ${unidad.activa ? 'desactivar' : 'activar'} la unidad mientras se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    const accion = unidad.activa ? 'desactivar' : 'activar';
    const titulo = unidad.activa ? 'Confirmar desactivación' : 'Confirmar activación';
    const mensaje = unidad.activa 
      ? `¿Estás seguro de desactivar la unidad ${unidad.codigo}?`
      : `¿Estás seguro de activar la unidad ${unidad.codigo}?`;

    setModalConfirmacion({
      show: true,
      tipo: unidad.activa ? 'desactivar' : 'activar',
      titulo,
      mensaje,
      itemNombre: unidad.codigo,
      onConfirm: async () => {
        const estadoAnterior = unidad.activa;
        setUnidad(prev => ({ ...prev, activa: !prev.activa }));

        try {
          await unidadService.toggleActiva(id, !unidad.activa);
          toast.success(`Unidad ${!unidad.activa ? 'activada' : 'desactivada'} correctamente`, {
            icon: <Power size={18} className={`${!unidad.activa ? 'text-green-500' : 'text-yellow-500'}`} />
          });
          await cargarUnidad();
        } catch (error) {
          setUnidad(prev => ({ ...prev, activa: estadoAnterior }));

          console.error("Error cambiando estado:", error);
          if (error.response?.status === 429) {
            toast.error('Demasiadas peticiones. Espera unos segundos...', {
              icon: <Clock size={18} className="text-yellow-500" />
            });
          } else {
            toast.error(error.error || 'Error al cambiar estado');
          }
        }
      }
    });
  };

  // ELIMINAR CON VALIDACIÓN DE UNIDAD OCUPADA
  const handleEliminar = async () => {
    // Validar si la unidad está ocupada
    if (unidad.estado === 'ocupada') {
      setModalInfo({
        show: true,
        mensaje: `No es posible eliminar la unidad mientras se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }

    setModalConfirmacion({
      show: true,
      tipo: 'eliminar',
      titulo: 'Confirmar eliminación',
      mensaje: `¿Estás seguro de eliminar la unidad ${unidad.codigo}?`,
      itemNombre: unidad.codigo,
      onConfirm: async () => {
        try {
          await unidadService.eliminarUnidad(id);
          toast.success('Unidad eliminada correctamente', {
            icon: <Trash2 size={18} className="text-red-500" />
          });
          navigate('/admin/unidades');
        } catch (error) {
          console.error("Error eliminando unidad:", error);
          if (error.response?.status === 429) {
            toast.error('Demasiadas peticiones. Espera unos segundos...', {
              icon: <Clock size={18} className="text-yellow-500" />
            });
          } else {
            toast.error(error.error || 'Error al eliminar unidad');
          }
        }
      }
    });
  };

  // EDITAR CON VALIDACIÓN DE UNIDAD OCUPADA
  const handleEditar = () => {
    if (unidad.estado === 'ocupada') {
      setModalInfo({
        show: true,
        mensaje: `No es posible editar la unidad mientras se encuentra en estado OCUPADA atendiendo una emergencia activa.`
      });
      return;
    }
    navigate(`/admin/unidades/editar/${id}`);
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
          <p className="text-gray-500">Cargando información de la unidad...</p>
        </div>
      </div>
    );
  }

  if (error || !unidad) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 rounded-xl shadow p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se encontró la unidad'}</p>
          <button
            onClick={() => navigate('/admin/unidades')}
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
      {/* Modal de acción no permitida */}
      <ModalAccionNoPermitida
        isOpen={modalInfo.show}
        onClose={() => setModalInfo({ show: false, mensaje: '' })}
        mensaje={modalInfo.mensaje}
      />

      {/* Modal de confirmación */}
      <ModalConfirmacion
        isOpen={modalConfirmacion.show}
        onClose={() => setModalConfirmacion({ ...modalConfirmacion, show: false })}
        onConfirm={modalConfirmacion.onConfirm || (() => {})}
        titulo={modalConfirmacion.titulo}
        mensaje={modalConfirmacion.mensaje}
        itemNombre={modalConfirmacion.itemNombre}
        tipoAccion={modalConfirmacion.tipo}
      />

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
            <h1 className="text-2xl font-bold text-gray-800">Detalle de Unidad</h1>
            <p className="text-sm text-gray-500 mt-1">
              Información completa de {unidad.codigo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${unidad.activa
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
            }`}>
            {unidad.activa ? 'Activa' : 'Inactiva'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${unidad.estado === 'disponible' ? 'bg-green-100 text-green-700' :
            unidad.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
            {unidad.estado === 'disponible' ? 'Disponible' :
              unidad.estado === 'ocupada' ? 'Ocupada' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Cabecera con icono */}
        <div className={`bg-gradient-to-r px-6 py-8 ${unidad.tipo === 'policia'
          ? 'from-blue-600 to-blue-800'
          : 'from-green-600 to-green-800'
          }`}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Truck size={36} className={unidad.tipo === 'policia' ? 'text-blue-600' : 'text-green-600'} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{unidad.codigo}</h2>
              <p className="text-white/80 mt-1">ID: {unidad.id}</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoItem
              icon={unidad.tipo === 'policia' ? Shield : Ambulance}
              label="Tipo de unidad"
              value={
                <span className={`px-2 py-1 rounded-full text-xs ${unidad.tipo === 'policia'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
                  }`}>
                  {unidad.tipo === 'policia' ? 'Policía' : 'Ambulancia'}
                </span>
              }
            />
            <InfoItem
              icon={Hash}
              label="Código"
              value={unidad.codigo}
            />
            <InfoItem
              icon={MapPin}
              label="Ubicación"
              value={unidad.lat && unidad.lng
                ? `${unidad.lat.toFixed(6)}, ${unidad.lng.toFixed(6)}`
                : 'No disponible'
              }
            />
            <InfoItem
              icon={FileText}
              label="Descripción"
              value={unidad.descripcion || 'Sin descripción'}
            />
          </div>

          {/* Personal asignado */}
          <div className="border-t pt-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users size={20} />
                Personal asignado ({unidad.personal_asignado?.length || 0})
              </h3>
              <button
                onClick={cargarPersonalDisponible}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus size={16} />
                Asignar personal
              </button>
            </div>

            {/* Formulario de asignación */}
            {mostrarAsignacion && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3">Seleccionar personal</h4>
                {cargandoPersonal ? (
                  <div className="text-center py-4">
                    <Loader size={24} className="animate-spin text-blue-600 mx-auto" />
                  </div>
                ) : personalDisponible.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No hay personal disponible para asignar
                  </p>
                ) : (
                  <>
                    <select
                      value={personalSeleccionado}
                      onChange={(e) => setPersonalSeleccionado(e.target.value)}
                      className="w-full p-2 border border-blue-300 rounded-lg mb-3"
                    >
                      <option value="">Seleccionar...</option>
                      {personalDisponible.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.rol === 'policia' ? 'Policía' : p.rol === 'ambulancia' ? 'Ambulancia' : p.rol} ({p.placa})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAsignar}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                      >
                        Asignar
                      </button>
                      <button
                        onClick={() => setMostrarAsignacion(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Lista de personal asignado */}
            {unidad.personal_asignado && unidad.personal_asignado.length > 0 ? (
              <div className="space-y-3">
                {unidad.personal_asignado.map((persona) => (
                  <div key={persona.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {persona.nombre?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{persona.nombre}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {persona.rol === 'policia' ? 'Policía' :
                            persona.rol === 'ambulancia' ? 'Ambulancia' : persona.rol} • {persona.placa}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemover(persona.id, persona.nombre)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay personal asignado</p>
            )}
          </div>

          {/* Auditoría */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuditItem
                icon={Calendar}
                label="Creado el"
                value={formatDate(unidad.creado_en)}
              />
              <AuditItem
                icon={User}
                label="Creado por"
                value={corregirTexto(unidad.creador?.nombre) || 'Sistema'}
              />
              <AuditItem
                icon={Calendar}
                label="Actualizado el"
                value={formatDate(unidad.actualizado_en)}
              />
              <AuditItem
                icon={User}
                label="Actualizado por"
                value={corregirTexto(unidad.actualizador?.nombre) || 'Sistema'}
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleToggleActiva}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${unidad.activa
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-green-600 text-white hover:bg-green-700'
              }`}
          >
            <Power size={18} />
            {unidad.activa ? 'Desactivar' : 'Activar'}
          </button>

          <button
            onClick={handleEditar}
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

// Componentes auxiliares
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
    <Icon size={20} className="text-blue-600 mt-1" />
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="text-sm font-medium text-gray-800 mt-1">{value}</div>
    </div>
  </div>
);

const AuditItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={16} className="text-gray-400 mt-1" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

export default UnidadDetail;