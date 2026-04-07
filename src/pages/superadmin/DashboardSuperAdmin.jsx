// src/pages/superadmin/DashboardSuperAdmin.jsx
import { useState, useEffect, useCallback } from 'react';
import { Building2, Users, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, trend }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        yellow: 'from-yellow-500 to-yellow-600',
        purple: 'from-purple-500 to-purple-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend > 0 ? (
                                <TrendingUp size={14} className="text-green-500" />
                            ) : trend < 0 ? (
                                <TrendingDown size={14} className="text-red-500" />
                            ) : null}
                            <span className={`text-xs ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {Math.abs(trend)}% vs mes anterior
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 bg-gradient-to-r ${colors[color]} rounded-xl shadow-lg`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const DashboardSuperAdmin = () => {
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        pendientes: 0,
        suspendidos: 0,
        expirados: 0,
        porVencer: 0
    });
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await tenantService.listarTenants();
            if (response.success && response.data) {
                const tenantsList = response.data;
                setTenants(tenantsList);

                // Calcular estadísticas
                const ahora = new Date();
                const dentroDe30Dias = new Date();
                dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);

                const statsCalculadas = {
                    total: tenantsList.length,
                    activos: tenantsList.filter(t => t.activo === true && t.status === 'active').length,
                    pendientes: tenantsList.filter(t => t.status === 'pending').length,
                    suspendidos: tenantsList.filter(t => t.status === 'suspended').length,
                    expirados: tenantsList.filter(t => t.status === 'expired' || (t.fecha_expiracion && new Date(t.fecha_expiracion) < ahora && t.status !== 'pending')).length,
                    porVencer: tenantsList.filter(t => t.fecha_expiracion && new Date(t.fecha_expiracion) > ahora && new Date(t.fecha_expiracion) < dentroDe30Dias).length
                };

                setStats(statsCalculadas);
            } else {
                setError(response.error || 'Error al cargar datos');
            }
        } catch (err) {
            console.error('Error cargando dashboard:', err);
            setError(err.message || 'Error al cargar el dashboard');
            toast.error('Error al cargar los datos del dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
                <p className="text-red-600">{error}</p>
                <button
                    onClick={cargarDatos}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard de Control</h1>
                    <p className="text-gray-500 mt-1">Gestión de municipios y planes</p>
                </div>
                <button
                    onClick={cargarDatos}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Actualizar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title="Total Municipios"
                    value={stats.total}
                    icon={<Building2 size={24} className="text-white" />}
                    color="blue"
                />
                <StatCard
                    title="Activos"
                    value={stats.activos}
                    icon={<CheckCircle size={24} className="text-white" />}
                    color="green"
                />
                <StatCard
                    title="Pendientes"
                    value={stats.pendientes}
                    icon={<Clock size={24} className="text-white" />}
                    color="yellow"
                />
                <StatCard
                    title="Suspendidos"
                    value={stats.suspendidos}
                    icon={<XCircle size={24} className="text-white" />}
                    color="red"
                />
                <StatCard
                    title="Por Vencer (30d)"
                    value={stats.porVencer}
                    icon={<AlertTriangle size={24} className="text-white" />}
                    color="yellow"
                />
                <StatCard
                    title="Expirados"
                    value={stats.expirados}
                    icon={<XCircle size={24} className="text-white" />}
                    color="red"
                />
            </div>

            {/* Tabla de municipios recientes */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Municipios Registrados</h2>
                    <p className="text-sm text-gray-500">Lista de todos los municipios en el sistema</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
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
                            {tenants.filter(t => t.id !== 'default').slice(0, 10).map((tenant) => (
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
                                        {tenant.status === 'active' && tenant.activo ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Activo</span>
                                        ) : tenant.status === 'pending' ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pendiente</span>
                                        ) : tenant.status === 'suspended' ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Suspendido</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.fecha_expiracion ? (
                                            <span className="text-sm text-gray-600">
                                                {new Date(tenant.fecha_expiracion).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => navigate(`/superadmin/municipios/${tenant.id}`)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {tenants.filter(t => t.id !== 'default').length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No hay municipios registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardSuperAdmin;