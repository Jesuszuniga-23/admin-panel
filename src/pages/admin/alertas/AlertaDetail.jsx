import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Clock, MapPin, User, Calendar, ChevronLeft,
  Loader, AlertCircle, CheckCircle, XCircle, FileText,
  Shield, Phone, Mail, MessageSquare, X
} from 'lucide-react';
import alertasService from '../../../services/admin/alertas.service';
import toast from 'react-hot-toast';

const AlertaDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      setLoading(true);
      console.log("📡 Cargando alerta ID:", id);
      
      // Buscar en expiradas y cerradas
      const [expiradasRes, cerradasRes] = await Promise.allSettled([
        alertasService.obtenerExpiradas({ limite: 100 }),
        alertasService.obtenerCerradasManual({ limite: 100 })
      ]);

      const expiradas = expiradasRes.status === 'fulfilled' ? expiradasRes.value.data || [] : [];
      const cerradas = cerradasRes.status === 'fulfilled' ? cerradasRes.value.data || [] : [];
      
      const encontrada = [...expiradas, ...cerradas].find(a => a.id === parseInt(id));
      
      if (encontrada) {
        console.log("Alerta encontrada:", encontrada);
        setAlerta(encontrada);
      } else {
        setError('Alerta no encontrada');
      }
      
    } catch (error) {
      console.error("Error cargando alerta:", error);
      setError('Error al cargar la alerta');
    } finally {
      setLoading(false);
    }
  };

  const handleCerrarManual = async () => {
    if (!motivoCierre.trim()) {
      toast.error('Debes proporcionar un motivo para el cierre');
      return;
    }

    setCerrando(true);
    try {
      const response = await alertasService.cerrarManual(id, motivoCierre);
      
      if (response.success) {
        toast.success('Alerta cerrada manualmente');
        setMostrarModalCierre(false);
        setMotivoCierre('');
        
        // Actualizar la alerta localmente
        setAlerta(prev => ({
          ...prev,
          estado: 'cerrada',
          cerrada_manualmente: true,
          motivo_cierre_manual: motivoCierre
        }));
        
        // Recargar después de 2 segundos para asegurar datos actualizados
        setTimeout(() => cargarAlerta(), 2000);
      }
    } catch (error) {
      console.error("Error cerrando alerta:", error);
      toast.error(error.error || 'Error al cerrar la alerta');
    } finally {
      setCerrando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'activa': return 'bg-red-100 text-red-700 border-red-200';
      case 'expirada': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cerrada': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'activa': return <AlertTriangle size={16} />;
      case 'expirada': return <Clock size={16} />;
      case 'cerrada': return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando información de la alerta...</p>
        </div>
      </div>
    );
  }

  if (error || !alerta) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 rounded-2xl shadow-lg p-8 text-center border border-red-200">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se encontró la alerta'}</p>
          <button
            onClick={() => navigate('/admin/alertas/expiradas')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Volver a alertas
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
            onClick={() => navigate('/admin/alertas/expiradas')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detalle de Alerta</h1>
            <p className="text-sm text-gray-500 mt-1">ID: #{alerta.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${getEstadoColor(alerta.estado)}`}>
            {getEstadoIcon(alerta.estado)}
            {alerta.estado}
          </span>
          
          {alerta.estado !== 'cerrada' && alerta.estado !== 'cancelada' && (
            <button
              onClick={() => setMostrarModalCierre(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors"
            >
              <XCircle size={18} />
              Cerrar Manualmente
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Cabecera con tipo */}
        <div className={`px-6 py-4 ${
          alerta.tipo === 'panico' ? 'bg-red-600' : 'bg-amber-600'
        }`}>
          <div className="flex items-center gap-3">
            {alerta.tipo === 'panico' ? (
              <AlertTriangle size={24} className="text-white" />
            ) : (
              <AlertCircle size={24} className="text-white" />
            )}
            <h2 className="text-xl font-semibold text-white">
              Alerta de {alerta.tipo === 'panico' ? 'Pánico' : 'Emergencia Médica'}
            </h2>
          </div>
        </div>

        <div className="p-6">
          {/* Grid de información */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoItem 
              icon={Calendar}
              label="Fecha de creación"
              value={new Date(alerta.fecha_creacion).toLocaleString('es-MX')}
            />
            
            {alerta.fecha_expiracion && (
              <InfoItem 
                icon={Clock}
                label="Fecha de expiración"
                value={new Date(alerta.fecha_expiracion).toLocaleString('es-MX')}
              />
            )}
            
            {alerta.fecha_cierre && (
              <InfoItem 
                icon={CheckCircle}
                label="Fecha de cierre"
                value={new Date(alerta.fecha_cierre).toLocaleString('es-MX')}
              />
            )}
            
            <InfoItem 
              icon={MapPin}
              label="Ubicación"
              value={alerta.lat && alerta.lng 
                ? `${alerta.lat.toFixed(6)}, ${alerta.lng.toFixed(6)}`
                : 'No disponible'
              }
            />
          </div>

          {/* Información del ciudadano */}
          {alerta.ciudadano && (
            <div className="border-t pt-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} />
                Información del Ciudadano
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem 
                  icon={User}
                  label="Nombre"
                  value={alerta.ciudadano.nombre || 'No disponible'}
                />
                <InfoItem 
                  icon={Phone}
                  label="Teléfono"
                  value={alerta.ciudadano.telefono || 'No disponible'}
                />
              </div>
            </div>
          )}

          {/* Motivo de cierre manual */}
          {alerta.cerrada_manualmente && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                Motivo de cierre manual
              </h3>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-gray-700">{alerta.motivo_cierre_manual || 'Sin motivo especificado'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de cierre */}
      {mostrarModalCierre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Cerrar Alerta Manualmente</h3>
              <button
                onClick={() => setMostrarModalCierre(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Estás a punto de cerrar la alerta <span className="font-semibold">#{alerta.id}</span>.
              Por favor, proporciona un motivo para el cierre:
            </p>

            <textarea
              value={motivoCierre}
              onChange={(e) => setMotivoCierre(e.target.value)}
              placeholder="Ej: Falsa alarma, ya no es relevante, etc."
              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              disabled={cerrando}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCerrarManual}
                disabled={cerrando}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cerrando ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
              <button
                onClick={() => setMostrarModalCierre(false)}
                disabled={cerrando}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
    <Icon size={20} className="text-blue-600 mt-1" />
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

export default AlertaDetail;