// src/pages/superadmin/TenantForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Save, X, ArrowLeft, Users } from 'lucide-react';
import tenantService from '../../services/admin/tenant.service';
import toast from 'react-hot-toast';

const TenantForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        slug: '',
        activo: true,
        poblacion: '',
        plan_id: '',
        fecha_expiracion: '',
        configuracion: {},
        notes: ''
    });

    useEffect(() => {
        if (isEditing) {
            cargarTenant();
        }
    }, [id]);

    const cargarTenant = async () => {
        setLoading(true);
        try {
            const response = await tenantService.obtenerTenant(id);
            if (response.success && response.data) {
                const tenant = response.data;
                setFormData({
                    id: tenant.id,
                    nombre: tenant.nombre,
                    slug: tenant.slug || '',
                    activo: tenant.activo,
                    poblacion: tenant.poblacion || '',
                    plan_id: tenant.plan_id || '',
                    fecha_expiracion: tenant.fecha_expiracion ? new Date(tenant.fecha_expiracion).toISOString().split('T')[0] : '',
                    configuracion: tenant.configuracion || {},
                    notes: tenant.notes || ''
                });
            }
        } catch (error) {
            toast.error('Error al cargar datos');
            navigate('/superadmin/municipios');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Validar población
            if (!formData.poblacion || parseInt(formData.poblacion) <= 0) {
                toast.error('La población debe ser un número mayor a 0');
                setSaving(false);
                return;
            }

            let response;
            if (isEditing) {
                response = await tenantService.actualizarTenant(id, formData);
            } else {
                response = await tenantService.crearTenant(formData);
            }

            if (response.success) {
                toast.success(isEditing ? 'Municipio actualizado' : 'Municipio creado');
                navigate('/superadmin/municipios');
            } else {
                toast.error(response.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error(error.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/superadmin/municipios')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isEditing ? 'Editar Municipio' : 'Nuevo Municipio'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEditing ? 'Modifica la información del municipio' : 'Registra un nuevo municipio en el sistema'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                {/* ID - Solo visible en creación */}
                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID del Municipio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            placeholder="ej: tehuacan, puebla, guadalajara"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                            pattern="[a-z0-9_-]+"
                            title="Solo letras minúsculas, números, guiones y guiones bajos"
                        />
                        <p className="text-xs text-gray-500 mt-1">Identificador único (solo minúsculas, números, - y _)</p>
                    </div>
                )}

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Municipio <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej: Tehuacán, Puebla, Guadalajara"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL amigable)</label>
                    <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        placeholder="tehuacan (opcional, usa el ID si está vacío)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* ✅ NUEVOS CAMPOS: Población y Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Población <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Users size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                name="poblacion"
                                value={formData.poblacion}
                                onChange={handleChange}
                                placeholder="Ej: 15000"
                                min="1"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Número de habitantes</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="plan_id"
                            value={formData.plan_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Selecciona un plan</option>
                            <option value="basico">Básico (hasta 10,000 hab) - $4,500/mes</option>
                            <option value="premium">Estándar (10,001 - 50,000 hab) - $8,500/mes</option>
                            <option value="enterprise">Avanzado (más de 50,000 hab) - $14,000/mes</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Plan asignado según población</p>
                    </div>
                </div>

                {/* Fecha expiración y estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Expiración</label>
                        <input
                            type="date"
                            name="fecha_expiracion"
                            value={formData.fecha_expiracion}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Dejar vacío para plan de prueba</p>
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Activo</span>
                        </label>
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Información adicional sobre este municipio..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/superadmin/municipios')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <Save size={16} />
                        )}
                        {isEditing ? 'Guardar Cambios' : 'Crear Municipio'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TenantForm;