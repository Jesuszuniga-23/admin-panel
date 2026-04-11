import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Eye, Power, Mail, Phone, User, X, Filter, Crown } from 'lucide-react';
import personalService from '../../services/admin/personal.service';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';
const AdminsMunicipales = () => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');
    const searchTerm = useDebounce(search, 500);
    const abortControllerRef = useRef(null);

    const cargarDatos = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
            // Cargar tenants para el filtro
            const tenantsRes = await tenantService.listarTenants();
            if (tenantsRes.success) {
                setTenants(tenantsRes.data.filter(t => t.id !== 'default'));
            }

            // Cargar admins (rol = 'admin')
            const adminsRes = await personalService.listarPersonal({
                rol: 'admin',
                limite: 500,
                signal: abortControllerRef.current.signal
            });

            if (adminsRes.success) {
                let filtrados = adminsRes.data;

                if (searchTerm) {
                    filtrados = filtrados.filter(a =>
                        a.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.tenant_id?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                if (tenantFilter) {
                    filtrados = filtrados.filter(a => a.tenant_id === tenantFilter);
                }

                setAdmins(filtrados);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error('Error al cargar datos');
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
    }, [searchTerm, tenantFilter]);

    const handleToggleActivo = async (id, nombre, activo) => {
        if (!confirm(`¿${activo ? 'Desactivar' : 'Activar'} a ${nombre}?`)) return;

        try {
            await personalService.toggleActivo(id, !activo);
            toast.success(`Admin ${!activo ? 'activado' : 'desactivado'}`);
            cargarDatos();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const getTenantNombre = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        return tenant?.nombre || tenantId;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                    <Crown size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Administradores Municipales</h1>
                    <p className="text-gray-500 mt-1">Gestión de admins de todos los municipios</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o municipio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={tenantFilter}
                        onChange={(e) => setTenantFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todos los municipios</option>
                        {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setSearch(''); setTenantFilter(''); }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Cargando administradores...</p>
                    </div>
                ) : admins.length === 0 ? (
                    <div className="p-12 text-center">
                        <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No hay administradores</h3>
                        <p className="text-sm text-gray-500">No se encontraron administradores municipales</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Municipio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {admins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <User size={18} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {admin.nombre} {admin.apellido_paterno} {admin.apellido_materno}
                                                    </p>
                                                    <p className="text-xs text-gray-400">ID: {admin.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600">{getTenantNombre(admin.tenant_id)}</span>
                                            </div>
                                            <code className="text-xs text-gray-400">{admin.tenant_id}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {admin.email}
                                                </p>
                                                {admin.telefono && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {admin.telefono}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{admin.placa}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${admin.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {admin.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/superadmin/municipios/${admin.tenant_id}`)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                    title="Ver municipio"
                                                >
                                                    <Eye size={16} className="text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActivo(admin.id, `${admin.nombre} ${admin.apellido_paterno}`, admin.activo)}
                                                    className={`p-2 rounded-lg ${admin.activo ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}
                                                    title={admin.activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminsMunicipales;