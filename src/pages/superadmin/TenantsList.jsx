// src/pages/superadmin/TenantsList.jsx - VERSIÓN CORREGIDA
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Eye, Edit, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, Unlock } from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';

const TenantsList = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [showPayModal, setShowPayModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [periodo, setPeriodo] = useState('anual');
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const abortControllerRef = useRef(null);
    const isMounted = useRef(true);

    const getStatusBadge = (status, activo) => {
        if (status === 'active' && activo) {
            return { text: 'Activo', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} className="mr-1" /> };
        }
        if (status === 'pending') {
            return { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} className="mr-1" /> };
        }
        if (status === 'suspended') {
            return { text: 'Suspendido', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} className="mr-1" /> };
        }
        if (status === 'expired') {
            return { text: 'Expirado', color: 'bg-gray-100 text-gray-700', icon: <AlertTriangle size={12} className="mr-1" /> };
        }
        return { text: 'Inactivo', color: 'bg-gray-100 text-gray-700', icon: null };
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX');
    };

    const cargarTenants = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (!isMounted.current) return;
        setLoading(true);

        try {
            console.log('🔍 Fetching tenants...');
            const response = await tenantService.listarTenants({
                signal: abortControllerRef.current.signal
            });

            if (!isMounted.current) return;

            if (response.success && response.data) {
                let filteredTenants = [...response.data];

                // ✅ FILTRADO SEGURO - search es string
                const searchValue = typeof search === 'string' ? search.trim() : '';
                if (searchValue !== '') {
                    const searchLower = searchValue.toLowerCase();
                    filteredTenants = filteredTenants.filter(t => {
                        const nombre = t.nombre ? String(t.nombre).toLowerCase() : '';
                        const id = t.id ? String(t.id).toLowerCase() : '';
                        return nombre.includes(searchLower) || id.includes(searchLower);
                    });
                }

                // Filtrar por estado
                if (statusFilter && statusFilter !== '') {
                    filteredTenants = filteredTenants.filter(t => t.status === statusFilter);
                }

                // Filtrar por plan
                if (planFilter && planFilter !== '') {
                    filteredTenants = filteredTenants.filter(t => t.plan_id === planFilter);
                }

                // Excluir default
                filteredTenants = filteredTenants.filter(t => t.id !== 'default');

                setTenants(filteredTenants);
            } else {
                toast.error(response.error || 'Error al cargar municipios');
            }
        } catch (error) {
            if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
                console.error('Error cargando tenants:', error);
                if (isMounted.current) {
                    toast.error('Error al cargar municipios');
                }
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    // ✅ useEffect SOLO UNA VEZ - sin dependencias problemáticas
    useEffect(() => {
        isMounted.current = true;
        cargarTenants();

        return () => {
            isMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []); // ← ARREGLO VACÍO - solo se ejecuta una vez

    // ✅ Función para aplicar filtros (recarga manual)
    const aplicarFiltros = () => {
        cargarTenants();
    };

    if (loading && tenants.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Municipios</h1>
                    <p className="text-gray-500 mt-1">Gestión de todos los municipios del sistema</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={aplicarFiltros}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Search size={16} />
                        Aplicar filtros
                    </button>
                    <button
                        onClick={() => navigate('/superadmin/municipios/nuevo')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Nuevo Municipio
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="pending">Pendientes</option>
                        <option value="suspended">Suspendidos</option>
                        <option value="expired">Expirados</option>
                    </select>

                    <select
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos los planes</option>
                        <option value="basico">Básico</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Municipio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiración</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay municipios registrados
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => {
                                    const statusInfo = getStatusBadge(tenant.status, tenant.activo);
                                    return (
                                        <tr key={tenant.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-gray-400" />
                                                    <span className="font-medium text-gray-800">{tenant.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{tenant.id}</code>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {tenant.plan_id || 'Sin plan'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.icon}
                                                    {statusInfo.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {formatDate(tenant.fecha_expiracion)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/superadmin/municipios/${tenant.id}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/superadmin/municipios/${tenant.id}/editar`)}
                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>

                                                    {/* Botón Pagar */}
                                                    {(tenant.status === 'trial' || tenant.status === 'expired') && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTenant(tenant);
                                                                setShowPayModal(true);
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Registrar pago"
                                                        >
                                                            <CreditCard size={18} />
                                                        </button>
                                                    )}

                                                    {/* Botón Suspender */}
                                                    {tenant.status === 'active' && tenant.id !== 'default' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTenant(tenant);
                                                                setShowSuspendModal(true);
                                                            }}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Suspender"
                                                        >
                                                            <Lock size={18} />
                                                        </button>
                                                    )}

                                                    {/* Botón Reactivar */}
                                                    {tenant.status === 'suspended' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm(`¿Reactivar ${tenant.nombre}?`)) {
                                                                    try {
                                                                        await tenantService.reactivarTenant(tenant.id);
                                                                        toast.success('Municipio reactivado');
                                                                        cargarTenants();
                                                                    } catch (error) {
                                                                        toast.error('Error al reactivar');
                                                                    }
                                                                }
                                                            }}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Reactivar"
                                                        >
                                                            <Unlock size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal de Pago */}
            {showPayModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">💰 Registrar Pago</h3>
                        <p className="text-gray-600 mb-4">Municipio: <strong>{selectedTenant.nombre}</strong></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Período</label>
                                <select
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg"
                                >
                                    <option value="mensual">Mensual</option>
                                    <option value="anual">Anual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Monto</label>
                                <input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="Ej: 499"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={async () => {
                                    setActionLoading(true);
                                    try {
                                        await tenantService.marcarComoPagado(selectedTenant.id, periodo, monto);
                                        toast.success('✅ Pago registrado');
                                        setShowPayModal(false);
                                        setMonto('');
                                        cargarTenants();
                                    } catch (error) {
                                        toast.error('Error al registrar pago');
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Procesando...' : 'Confirmar'}
                            </button>
                            <button
                                onClick={() => { setShowPayModal(false); setMonto(''); }}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Suspensión */}
            {showSuspendModal && selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">🔒 Suspender Municipio</h3>
                        <p className="text-gray-600 mb-4">Municipio: <strong>{selectedTenant.nombre}</strong></p>

                        <div>
                            <label className="block text-sm font-medium mb-1">Motivo</label>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Motivo de la suspensión"
                                className="w-full px-4 py-2 border rounded-lg"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={async () => {
                                    setActionLoading(true);
                                    try {
                                        await tenantService.suspenderTenant(selectedTenant.id, motivo);
                                        toast.success('🔒 Municipio suspendido');
                                        setShowSuspendModal(false);
                                        setMotivo('');
                                        cargarTenants();
                                    } catch (error) {
                                        toast.error('Error al suspender');
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Procesando...' : 'Confirmar'}
                            </button>
                            <button
                                onClick={() => { setShowSuspendModal(false); setMotivo(''); }}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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

export default TenantsList;