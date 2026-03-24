// src/pages/admin/alertas/AlertaPanelDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Mail, AlertTriangle, 
  Shield, Lock, Eye, EyeOff, CheckCircle, XCircle,
  Clock, Truck, User, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import alertasPanelService from '../../../services/admin/alertasPanel.service';
import MapaOSM from '../../../components/maps/MapaOSM';

const AlertaPanelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alerta, setAlerta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solicitandoOtp, setSolicitandoOtp] = useState(false);
  const [verificandoOtp, setVerificandoOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpExpiracion, setOtpExpiracion] = useState(null);

  useEffect(() => {
    cargarAlerta();
  }, [id]);

  const cargarAlerta = async () => {
    try {
      const response = await alertasPanelService.obtenerDetalle(id);
      setAlerta(response.data);
      if (response.requiere_otp) {
        toast.info('Los datos sensibles están ocultos. Solicita un código para verlos.');
      }
    } catch (error) {
      console.error('Error cargando alerta:', error);
      toast.error('Error al cargar los detalles de la alerta');
      navigate('/admin/alertas/activas');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarOtp = async () => {
    setSolicitandoOtp(true);
    try {
      const response = await alertasPanelService.solicitarOtp(id);
      
      if (response.success) {
        setShowOtpModal(true);
        setOtpEmail(response.email_ofuscado);
        setOtpExpiracion(response.expiracion);
        toast.success(response.message);
      } else {
        toast.error(response.error || 'Error al solicitar código');
      }
    } catch (error) {
      console.error('Error solicitando OTP:', error);
      toast.error(error.response?.data?.error || 'Error al solicitar código');
    } finally {
      setSolicitandoOtp(false);
    }
  };

  const handleVerificarOtp = async () => {
    if (!codigoOtp || codigoOtp.length !== 6) {
      toast.error('Ingresa el código de 6 dígitos');
      return;
    }
    
    setVerificandoOtp(true);
    try {
      const response = await alertasPanelService.verificarOtp(id, codigoOtp);
      
      if (response.success) {
        setShowOtpModal(false);
        setCodigoOtp('');
        setAlerta(response.data);
        toast.success('Código verificado. Mostrando datos completos.');
      } else {
        toast.error(response.error || 'Código inválido');
      }
    } catch (error) {
      console.error('Error verificando OTP:', error);
      toast.error(error.response?.data?.error || 'Error al verificar código');
    } finally {
      setVerificandoOtp(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-MX');
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      confirmando: 'bg-yellow-100 text-yellow-800',
      activa: 'bg-red-100 text-red-800',
      asignada: 'bg-blue-100 text-blue-800',
      atendiendo: 'bg-purple-100 text-purple-800',
      cerrada: 'bg-green-100 text-green-800',
      expirada: 'bg-gray-100 text-gray-800',
      cancelada: 'bg-gray-100 text-gray-800'
    };
    return estados[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!alerta) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Alerta no encontrada</h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Volver
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Alerta #{alerta.id}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(alerta.estado)}`}>
                {alerta.estado.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">
                Tipo: {alerta.tipo === 'panico' ? '🚨 Pánico' : '🚑 Médica'}
              </span>
            </div>
          </div>
          
          {alerta.requiere_otp && (
            <button
              onClick={handleSolicitarOtp}
              disabled={solicitandoOtp}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {solicitandoOtp ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock size={18} />
              )}
              Solicitar código para ver datos completos
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {alerta.lat && alerta.lng && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Ubicación</h2>
              </div>
              <div className="h-64">
                <MapaOSM
                  lat={alerta.lat}
                  lng={alerta.lng}
                  zoom={15}
                  markerTitle={`Alerta ${alerta.tipo}`}
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalles del evento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="text-gray-400" size={18} />
                <span className="text-gray-600">Creada:</span>
                <span className="font-medium">{formatearFecha(alerta.fecha_creacion)}</span>
              </div>
              {alerta.fecha_asignacion && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="text-gray-400" size={18} />
                  <span className="text-gray-600">Asignada:</span>
                  <span className="font-medium">{formatearFecha(alerta.fecha_asignacion)}</span>
                </div>
              )}
              {alerta.fecha_cierre && (
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="text-gray-400" size={18} />
                  <span className="text-gray-600">Cerrada:</span>
                  <span className="font-medium">{formatearFecha(alerta.fecha_cierre)}</span>
                </div>
              )}
              {alerta.unidad && (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="text-gray-400" size={18} />
                  <span className="text-gray-600">Unidad:</span>
                  <span className="font-medium">{alerta.unidad.codigo} ({alerta.unidad.tipo})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={18} />
            Datos del ciudadano
          </h2>
          
          {alerta.ciudadano ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block">Nombre</label>
                <p className="font-medium text-gray-900">{alerta.ciudadano.nombre}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Teléfono</label>
                <p className="font-medium text-gray-900">{alerta.ciudadano.telefono || 'No registrado'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Email</label>
                <p className="font-medium text-gray-900">{alerta.ciudadano.email || 'No registrado'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay información del ciudadano</p>
          )}
        </div>
      </div>

      {/* Modal OTP */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <Shield className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mt-2">
                Verificación de seguridad
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Se ha enviado un código de verificación a:
              </p>
              <p className="font-medium text-gray-700">{otpEmail}</p>
              {otpExpiracion && (
                <p className="text-xs text-gray-400 mt-1">
                  Válido hasta: {new Date(otpExpiracion).toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                value={codigoOtp}
                onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setCodigoOtp('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerificarOtp}
                disabled={verificandoOtp || codigoOtp.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verificandoOtp ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Verificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertaPanelDetail;