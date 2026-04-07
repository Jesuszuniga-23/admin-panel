// src/pages/superadmin/TenantsList.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, Eye, Edit, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const TenantsList = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');

    const searchDebounced = useDebounce(search, 500);
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);

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

    const cargarTenants = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (!isMountedRef.current) return;
        setLoading(true);

        try {
            console.log('🔍 Fetching tenants...');
            const response = await tenantService.listarTenants({
                signal: abortControllerRef.current.signal
            });

            if (!isMountedRef.current) return;

            if (response.success && response.data) {
                let filteredTenants = [...response.data];

                // Filtrar por búsqueda
                if (searchDebounced && typeof searchDebounced === 'string' && searchDebounced.trim() !== '') {
                    const searchLower = searchDebounced.toLowerCase().trim();
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
                if (isMountedRef.current) {
                    toast.error('Error al cargar municipios');
                }
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [searchDebounced, statusFilter, planFilter]);

    useEffect(() => {
        isMountedRef.current = true;
        cargarTenants();

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [cargarTenants]);

    if (loading) {
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
                <button
                    onClick={() => navigate('/superadmin/municipios/nuevo')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Nuevo Municipio
                </button>
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
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/superadmin/municipios/${tenant.id}/editar`)}
                                                        className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/superadmin/municipios/${tenant.id}/pagar`)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Registrar pago"
                                                    >
                                                        <CreditCard size={18} />
                                                    </button>
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
        </div>
    );
};

export default TenantsList;