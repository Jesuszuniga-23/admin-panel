import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Lock, Download, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import dashboardTenantService from '../../services/tenant/dashboard.service';
import toast from 'react-hot-toast';

const TenantStatusBanner = ({ tenant }) => {
    const [diasRestantes, setDiasRestantes] = useState(0);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (tenant?.fecha_expiracion) {
            const expiracion = new Date(tenant.fecha_expiracion);
            const hoy = new Date();
            const diff = Math.ceil((expiracion - hoy) / (1000 * 60 * 60 * 24));
            setDiasRestantes(diff);
        }
    }, [tenant]);
    
    const handleDescargarOrdenPago = async () => {
        setLoading(true);
        try {
            await dashboardTenantService.descargarOrdenPago();
            toast.success('📄 Orden de pago descargada');
        } catch (error) {
            toast.error('Error al descargar la orden de pago');
        } finally {
            setLoading(false);
        }
    };
    
    if (!tenant) return null;
    
    // Banner para TRIAL
    if (tenant.status === 'trial') {
        return (
            <div className="space-y-3 mb-6">
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-amber-800">
                                Período de prueba activo
                            </p>
                            <p className="text-sm text-amber-700">
                                {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restantes de tu prueba gratuita
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Download size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-blue-800">
                                ¿Listo para continuar?
                            </p>
                            <p className="text-sm text-blue-700">
                                Descarga tu orden de pago y activa tu servicio por un año
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleDescargarOrdenPago}
                        disabled={loading}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Descargando...' : 'Ver Planes'}
                        {!loading && <Download size={16} />}
                    </button>
                </div>
            </div>
        );
    }
    
    // Banner para EXPIRED
    if (tenant.status === 'expired') {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                        <XCircle size={20} className="text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-800">
                            Servicio expirado
                        </p>
                        <p className="text-sm text-red-700">
                            Tu período de prueba ha terminado. Contacta al administrador para reactivar el servicio.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Banner para SUSPENDED
    if (tenant.status === 'suspended') {
        return (
            <div className="bg-gray-100 border-l-4 border-gray-500 rounded-r-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded-lg">
                        <Lock size={20} className="text-gray-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">
                            Servicio suspendido
                        </p>
                        <p className="text-sm text-gray-700">
                            El servicio está temporalmente suspendido. Contacta al administrador.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Banner para ACTIVE (mostrar vigencia)
    if (tenant.status === 'active' && tenant.fecha_expiracion) {
        const fechaFin = new Date(tenant.fecha_expiracion).toLocaleDateString('es-MX', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        
        return (
            <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-green-800">
                            Servicio activo
                        </p>
                        <p className="text-sm text-green-700">
                            Tu servicio está activo hasta el {fechaFin}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    return null;
};

export default TenantStatusBanner;