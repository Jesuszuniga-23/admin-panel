import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Building2, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, TrendingDown,
    Search, Filter, ChevronLeft, ChevronRight, Eye, Star, Crown
} from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon, color, trend }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        yellow: 'from-yellow-500 to-yellow-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600'
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
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        trial: 0,
        suspendidos: 0,
        expirados: 0,
        porVencer: 0
    });
    const [allTenants, setAllTenants] = useState([]);
    const [filteredTenants, setFilteredTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    
    // Paginación
    const [pagina, setPagina] = useState(1);
    const [limite] = useState(10);

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await tenantService.listarTenants();
            if (response.success && response.data) {
                const tenantsList = response.data.filter(t => t.id !== 'default');
                setAllTenants(tenantsList);

                // Calcular estadísticas
                const ahora = new Date();
                const dentroDe30Dias = new Date();
                dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);

                const statsCalculadas = {
                    total: tenantsList.length,
                    activos: tenantsList.filter(t => t.activo === true && t.status === 'active').length,
                    trial: tenantsList.filter(t => t.status === 'trial').length,
                    suspendidos: tenantsList.filter(t => t.status === 'suspended').length,
                    expirados: tenantsList.filter(t => t.status === 'expired').length,
                    porVencer: tenantsList.filter(t => 
                        t.fecha_expiracion && 
                        new Date(t.fecha_expiracion) > ahora && 
                        new Date(t.fecha_expiracion) < dentroDe30Dias
                    ).length
                };

                setStats(statsCalculadas);
                aplicarFiltros(tenantsList, search, statusFilter, planFilter);
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

    const aplicarFiltros = (tenantsList, searchTerm, status, plan) => {
        let filtrados = [...tenantsList];
        
        // Filtro por búsqueda
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtrados = filtrados.filter(t => 
                t.nombre?.toLowerCase().includes(term) ||
                t.id?.toLowerCase().includes(term)
            );
        }
        
        // Filtro por estado
        if (status) {
            filtrados = filtrados.filter(t => t.status === status);
        }
        
        // Filtro por plan
        if (plan) {
            filtrados = filtrados.filter(t => t.plan_id === plan);
        }
        
        setFilteredTenants(filtrados);
        setPagina(1); // Reset a primera página
    };

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Aplicar filtros cuando cambien
    useEffect(() => {
        if (allTenants.length > 0) {
            aplicarFiltros(allTenants, search, statusFilter, planFilter);
        }
    }, [search, statusFilter, planFilter, allTenants]);

    const limpiarFiltros = () => {
        setSearch('');
        setStatusFilter('');
        setPlanFilter('');
    };

    const getStatusBadge = (status, activo) => {
        if (status === 'active' && activo) {
            return { text: 'Activo', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} className="mr-1" /> };
        }
        if (status === 'trial') {
            return { text: 'Prueba', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} className="mr-1" /> };
        }
        if (status === 'suspended') {
            return { text: 'Suspendido', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} className="mr-1" /> };
        }
        if (status === 'expired') {
            return { text: 'Expirado', color: 'bg-gray-100 text-gray-700', icon: <AlertTriangle size={12} className="mr-1" /> };
        }
        return { text: 'Inactivo', color: 'bg-gray-100 text-gray-700', icon: null };
    };

    const getPlanNombre = (planId) => {
        const nombres = { 'basico': 'Básico', 'premium': 'Estándar', 'enterprise': 'Avanzado' };
        return nombres[planId] || planId || 'Sin plan';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX');
    };

    // Paginación
    const totalPaginas = Math.ceil(filteredTenants.length / limite);
    const inicio = (pagina - 1) * limite;
    const fin = inicio + limite;
    const tenantsPaginados = filteredTenants.slice(inicio, fin);

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
                <StatCard title="Total Municipios" value={stats.total} icon={<Building2 size={24} className="text-white" />} color="blue" />
                <StatCard title="Activos" value={stats.activos} icon={<CheckCircle size={24} className="text-white" />} color="green" />
                <StatCard title="En Prueba" value={stats.trial} icon={<Clock size={24} className="text-white" />} color="amber" />
                <StatCard title="Suspendidos" value={stats.suspendidos} icon={<XCircle size={24} className="text-white" />} color="red" />
                <StatCard title="Por Vencer (30d)" value={stats.porVencer} icon={<AlertTriangle size={24} className="text-white" />} color="yellow" />
                <StatCard title="Expirados" value={stats.expirados} icon={<XCircle size={24} className="text-white" />} color="red" />
            </div>

            {/* Cards de Acceso Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => navigate('/superadmin/superadmins')} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-700 mb-1">Super Administradores</p>
                            <p className="text-2xl font-bold text-amber-800">Gestionar</p>
                            <p className="text-xs text-amber-600 mt-2">Usuarios con acceso total al sistema</p>
                        </div>
                        <div className="bg-amber-500 p-4 rounded-xl"><Star size={28} className="text-white" /></div>
                    </div>
                </div>
                <div onClick={() => navigate('/superadmin/admins-municipales')} className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200 cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-indigo-700 mb-1">Administradores Municipales</p>
                            <p className="text-2xl font-bold text-indigo-800">Gestionar</p>
                            <p className="text-xs text-indigo-600 mt-2">Admins de todos los municipios</p>
                        </div>
                        <div className="bg-indigo-500 p-4 rounded-xl"><Crown size={28} className="text-white" /></div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-blue-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los estados</option>
                        <option value="trial">Prueba</option>
                        <option value="active">Activos</option>
                        <option value="suspended">Suspendidos</option>
                        <option value="expired">Expirados</option>
                    </select>
                    <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Todos los planes</option>
                        <option value="basico">Básico</option>
                        <option value="premium">Estándar</option>
                        <option value="enterprise">Avanzado</option>
                    </select>
                    <button onClick={limpiarFiltros} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                        Limpiar filtros
                    </button>
                </div>
                {(search || statusFilter || planFilter) && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-blue-600 font-medium">{filteredTenants.length} resultados</span>
                    </div>
                )}
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Municipios Registrados</h2>
                    <p className="text-sm text-gray-500">Lista de todos los municipios en el sistema</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Municipio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Población</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiración</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tenantsPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No hay municipios que coincidan con los filtros
                                    </td>
                                </tr>
                            ) : (
                                tenantsPaginados.map((tenant) => {
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
                                                <span className="text-sm text-gray-600">{getPlanNombre(tenant.plan_id)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{tenant.poblacion?.toLocaleString() || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.icon}{statusInfo.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{formatDate(tenant.fecha_expiracion)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button onClick={() => navigate(`/superadmin/municipios/${tenant.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver detalles">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {filteredTenants.length > 0 && (
                    <div className="px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">
                            Mostrando <span className="font-medium">{inicio + 1}</span> a <span className="font-medium">{Math.min(fin, filteredTenants.length)}</span> de{' '}
                            <span className="font-medium">{filteredTenants.length}</span> registros
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1.5 text-sm text-gray-600">
                                Página {pagina} de {totalPaginas}
                            </span>
                            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardSuperAdmin;