// src/pages/superadmin/TenantDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Building2, Edit, CreditCard, Power, ArrowLeft, 
    Users, Truck, Bell, Calendar, CheckCircle, XCircle,
    Clock, AlertTriangle, Save, X
} from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';

const TenantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ periodo: 'mensual', monto: 0 });
    const abortControllerRef = useRef(null);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX');
    };

    const getStatusBadge = (status, activo) => {
        if (status === 'active' && activo) {
            return { text: 'Activo', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> };
        }
        if (status === 'pending') {
            return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={16} /> };
        }
        if (status === 'suspended') {
            return { text: 'Suspendido', color: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> };
        }
        if (status === 'expired') {
            return { text: 'Expirado', color: 'bg-gray-100 text-gray-700', icon: <AlertTriangle size={16} /> };
        }
        return { text: 'Inactivo', color: 'bg-gray-100 text-gray-700', icon: null };
    };

    const cargarDatos = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
            const [tenantRes, statsRes] = await Promise.all([
                tenantService.obtenerTenant(id, { signal: abortControllerRef.current.signal }),
                tenantService.obtenerEstadisticas(id, { signal: abortControllerRef.current.signal })
            ]);

            if (tenantRes.success) {
                setTenant(tenantRes.data);
                setEditForm(tenantRes.data);
            }
            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error) {
            if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
                toast.error('Error al cargar datos');
                navigate('/superadmin/municipios');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [id]);

    const handleEdit = async () => {
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            const response = await tenantService.actualizarTenant(id, editForm);
            if (response.success) {
                setTenant(response.data);
                toast.success('Municipio actualizado correctamente');
                setEditing(false);
                cargarDatos();
            } else {
                toast.error(response.error || 'Error al actualizar');
            }
        } catch (error) {
            toast.error('Error al actualizar municipio');
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = !tenant.activo;
        try {
            const response = await tenantService.toggleTenant(id, newStatus);
            if (response.success) {
                toast.success(`Municipio ${newStatus ? 'activado' : 'desactivado'}`);
                cargarDatos();
            }
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleSuspend = async () => {
        if (!confirm('¿Estás seguro de suspender este municipio?')) return;
        try {
            const response = await tenantService.suspenderTenant(id, 'Suspendido por administrador');
            if (response.success) {
                toast.success('Municipio suspendido');
                cargarDatos();
            }
        } catch (error) {
            toast.error('Error al suspender');
        }
    };

    const handleReactivate = async () => {
        try {
            const response = await tenantService.reactivarTenant(id);
            if (response.success) {
                toast.success('Municipio reactivado');
                cargarDatos();
            }
        } catch (error) {
            toast.error('Error al reactivar');
        }
    };

    const handleRegisterPayment = async () => {
        try {
            const response = await tenantService.marcarComoPagado(id, paymentData.periodo, paymentData.monto);
            if (response.success) {
                toast.success(response.message);
                setShowPaymentModal(false);
                cargarDatos();
            }
        } catch (error) {
            toast.error('Error al registrar pago');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Municipio no encontrado</h3>
                <button onClick={() => navigate('/superadmin/municipios')} className="mt-4 text-blue-600 hover:text-blue-800">
                    Volver a municipios
                </button>
            </div>
        );
    }

    const statusInfo = getStatusBadge(tenant.status, tenant.activo);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/superadmin/municipios')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{tenant.nombre}</h1>
                        <p className="text-gray-500">ID: {tenant.id}</p>
                    </div>
                    <div className={`ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span className="ml-1">{statusInfo.text}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!editing && (
                        <>
                            <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Edit size={16} /> Editar
                            </button>
                            <button onClick={() => setShowPaymentModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <CreditCard size={16} /> Registrar Pago
                            </button>
                            {tenant.activo ? (
                                <button onClick={handleSuspend} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    <Power size={16} /> Suspender
                                </button>
                            ) : (
                                <button onClick={handleReactivate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    <Power size={16} /> Reactivar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modo edición */}
            {editing && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Editar Municipio</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" value={editForm.nombre || ''} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Slug</label>
                            <input type="text" value={editForm.slug || ''} onChange={(e) => setEditForm({...editForm, slug: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Usuarios</label>
                            <input type="number" value={editForm.max_usuarios || 0} onChange={(e) => setEditForm({...editForm, max_usuarios: parseInt(e.target.value)})} className="mt-1 w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Alertas/mes</label>
                            <input type="number" value={editForm.max_alertas_mensuales || 0} onChange={(e) => setEditForm({...editForm, max_alertas_mensuales: parseInt(e.target.value)})} className="mt-1 w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Fecha Expiración</label>
                            <input type="date" value={editForm.fecha_expiracion ? new Date(editForm.fecha_expiracion).toISOString().split('T')[0] : ''} onChange={(e) => setEditForm({...editForm, fecha_expiracion: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm text-gray-500">Usuarios</p><p className="text-2xl font-bold">{stats?.personal || 0}</p></div>
                        <Users size={24} className="text-blue-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm text-gray-500">Unidades</p><p className="text-2xl font-bold">{stats?.unidades || 0}</p></div>
                        <Truck size={24} className="text-purple-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm text-gray-500">Alertas Totales</p><p className="text-2xl font-bold">{stats?.alertas || 0}</p></div>
                        <Bell size={24} className="text-amber-500" />
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div><p className="text-sm text-gray-500">Expiración</p><p className="text-lg font-bold">{formatDate(tenant.fecha_expiracion)}</p></div>
                        <Calendar size={24} className="text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-3">Información del Plan</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Plan:</span> <span className="capitalize">{tenant.plan_id || 'Sin plan'}</span></div>
                    <div><span className="text-gray-500">Estado:</span> <span className="capitalize">{tenant.status}</span></div>
                    <div><span className="text-gray-500">Límite usuarios:</span> {tenant.max_usuarios || 'Ilimitado'}</div>
                    <div><span className="text-gray-500">Límite unidades:</span> {tenant.max_unidades || 'Ilimitado'}</div>
                    <div><span className="text-gray-500">Límite alertas/mes:</span> {tenant.max_alertas_mensuales || 'Ilimitado'}</div>
                    <div><span className="text-gray-500">Registrado:</span> {formatDate(tenant.created_at)}</div>
                </div>
                {tenant.notes && <div className="mt-4"><span className="text-gray-500">Notas:</span><p className="text-sm mt-1 bg-gray-50 p-3 rounded">{tenant.notes}</p></div>}
            </div>

            {/* Modal de Pago */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Registrar Pago</h2><button onClick={() => setShowPaymentModal(false)}><X size={20} /></button></div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium">Período</label><select value={paymentData.periodo} onChange={(e) => setPaymentData({...paymentData, periodo: e.target.value})} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="mensual">Mensual</option><option value="anual">Anual</option></select></div>
                            <div><label className="block text-sm font-medium">Monto</label><input type="number" value={paymentData.monto} onChange={(e) => setPaymentData({...paymentData, monto: parseFloat(e.target.value)})} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="0.00" /></div>
                            <div className="flex justify-end gap-3 pt-4"><button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button onClick={handleRegisterPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Registrar Pago</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantDetail;