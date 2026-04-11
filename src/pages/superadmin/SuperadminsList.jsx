import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Search, Edit, Power, Mail, Phone, User, Star } from 'lucide-react';
import personalService from '../../services/admin/personal.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const SuperadminsList = () => {
    const navigate = useNavigate();
    const [superadmins, setSuperadmins] = useState([]);
    const [superadminsOriginal, setSuperadminsOriginal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { value: searchTerm } = useDebounce(search, 500);
    const abortControllerRef = useRef(null);

    // ✅ Cargar TODOS los superadmins UNA SOLA VEZ
    const cargarSuperadmins = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
            const params = {
                rol: 'superadmin',
                limite: 100,
                signal: abortControllerRef.current.signal
            };

            const response = await personalService.listarPersonal(params);

            if (response.success) {
                setSuperadminsOriginal(response.data);
                aplicarFiltrosLocal(response.data);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                toast.error('Error al cargar superadmins');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Filtrar LOCALMENTE (como PersonalList)
    const aplicarFiltrosLocal = useCallback((datos) => {
        let filtrados = datos;

        if (searchTerm) {
            const term = String(searchTerm || '').toLowerCase();
            filtrados = filtrados.filter(p => {
                const nombre = String(p.nombre || '').toLowerCase();
                const email = String(p.email || '').toLowerCase();
                return nombre.includes(term) || email.includes(term);
            });
        }

        setSuperadmins(filtrados);
    }, [searchTerm]);

    // ✅ Cargar al montar
    useEffect(() => {
        cargarSuperadmins();
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [cargarSuperadmins]);

    // ✅ Re-filtrar cuando cambia searchTerm
    useEffect(() => {
        if (superadminsOriginal.length) {
            aplicarFiltrosLocal(superadminsOriginal);
        }
    }, [searchTerm, superadminsOriginal, aplicarFiltrosLocal]);

    const handleToggleActivo = async (id, nombre, activo) => {
        if (!confirm(`¿${activo ? 'Desactivar' : 'Activar'} a ${nombre}?`)) return;

        try {
            await personalService.toggleActivo(id, !activo);
            toast.success(`Superadmin ${!activo ? 'activado' : 'desactivado'}`);
            cargarSuperadmins();
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-MX');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                        <Star size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Super Administradores</h1>
                        <p className="text-gray-500 mt-1">Gestión de usuarios con acceso total al sistema</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/superadmin/superadmins/nuevo')}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                    <Plus size={18} />
                    <span>Nuevo Superadmin</span>
                </button>
            </div>

            {/* Búsqueda */}
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="relative max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Cargando superadmins...</p>
                    </div>
                ) : superadmins.length === 0 ? (
                    <div className="p-12 text-center">
                        <Shield size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No hay superadmins registrados</h3>
                        <p className="text-sm text-gray-500 mb-4">Crea el primer superadministrador</p>
                        <button
                            onClick={() => navigate('/superadmin/superadmins/nuevo')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                            <Plus size={16} />
                            Nuevo Superadmin
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Superadmin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {superadmins.map((sa) => (
                                    <tr key={sa.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <User size={18} className="text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {sa.nombre} {sa.apellido_paterno} {sa.apellido_materno}
                                                    </p>
                                                    <p className="text-xs text-gray-400">ID: {sa.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    {sa.email}
                                                </p>
                                                {sa.telefono && (
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        <Phone size={14} className="text-gray-400" />
                                                        {sa.telefono}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sa.placa}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${sa.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {sa.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{formatDate(sa.creado_en)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/superadmin/superadmins/editar/${sa.id}`)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} className="text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActivo(sa.id, `${sa.nombre} ${sa.apellido_paterno}`, sa.activo)}
                                                    className={`p-2 rounded-lg ${sa.activo ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'}`}
                                                    title={sa.activo ? 'Desactivar' : 'Activar'}
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

export default SuperadminsList;