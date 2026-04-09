import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Building2, User, Shield, MapPin, Mail, Phone, Loader2 } from 'lucide-react';
import registroService from '../../services/public/registro.service';
import toast from 'react-hot-toast';

const RegisterForm = ({ selectedPlan, onBack }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [cpValidando, setCpValidando] = useState(false);
    const [formData, setFormData] = useState({
        municipio_nombre: '',
        cp: '',
        estado: '',
        direccion: '',
        solicitante_nombre: '',
        solicitante_apellido_paterno: '',
        solicitante_apellido_materno: '',
        solicitante_email: '',
        solicitante_telefono: '',
        solicitante_cargo: '',
        admin_nombre: '',
        admin_apellido_paterno: '',
        admin_apellido_materno: '',
        admin_telefono: '',
        plan_id: selectedPlan.id
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ✅ API COPOMEX CON TOKEN SEGURO (variables de entorno)
    const validarCP = async (cp) => {
        if (cp.length !== 5) return;

        setCpValidando(true);
        try {
            const TOKEN = import.meta.env.VITE_COPOMEX_TOKEN;
            const url = `https://api.copomex.com/query/info_cp/${cp}?token=${TOKEN}`;
            const response = await fetch(url);

            if (!response.ok) {
                toast.error('Código postal no encontrado');
                return;
            }

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0 && data[0].response) {
                const info = data[0].response;
                setFormData(prev => ({
                    ...prev,
                    municipio_nombre: info.municipio,
                    estado: info.estado
                }));
                toast.success(`📍 ${info.municipio}, ${info.estado}`);
            } else {
                toast.error('No se encontraron datos para este CP');
            }
        } catch (error) {
            console.error('Error validando CP:', error);
            toast.error('Error al validar el código postal');
        } finally {
            setCpValidando(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await registroService.registrarMunicipio(formData);

            if (response.success) {
                const { tenant_id, admin_email } = response.data;
                localStorage.setItem('tenant_id', tenant_id);

                toast.success(
                    `✅ ¡Registro exitoso! Ahora inicia sesión con: ${admin_email}`,
                    { duration: 8000 }
                );

                navigate('/login', {
                    state: {
                        message: 'Registro completado. Inicia sesión con tu cuenta de Google.',
                        admin_email: admin_email,
                        tenant_id: tenant_id
                    }
                });
            } else {
                toast.error(response.error || 'Error al enviar solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMsg = error.error || 'Error al enviar solicitud';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Botón volver */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Volver a planes</span>
                </button>

                {/* Card principal */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Header con plan seleccionado */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Completa tu registro</h2>
                                <p className="text-blue-100 mt-1">30 días de prueba gratis • Sin tarjeta de crédito</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                                <p className="text-xs text-blue-100 uppercase tracking-wider">Plan seleccionado</p>
                                <p className="font-bold text-white text-lg">{selectedPlan.nombre}</p>
                                <p className="text-sm text-blue-100">{selectedPlan.precio}{selectedPlan.periodo && `/${selectedPlan.periodo}`}</p>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Sección: Datos del Municipio */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <Building2 size={20} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-800">Datos del Municipio</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Código Postal <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="cp"
                                            value={formData.cp}
                                            onChange={handleChange}
                                            onBlur={(e) => validarCP(e.target.value)}
                                            maxLength="5"
                                            pattern="\d{5}"
                                            required
                                            placeholder="Ej: 75710"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                        {cpValidando && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 size={18} className="animate-spin text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Ingresa 5 dígitos para autocompletar municipio y estado</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Municipio <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            name="municipio_nombre"
                                            value={formData.municipio_nombre}
                                            onChange={handleChange}
                                            readOnly={!!formData.municipio_nombre}
                                            required
                                            placeholder="Se autocompletará"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Estado <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        readOnly
                                        required
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        placeholder="Calle, número, colonia (opcional)"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección: Datos del Solicitante */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <User size={20} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-800">Datos del Solicitante (quien contrata)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="solicitante_nombre" 
                                        value={formData.solicitante_nombre} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Apellido Paterno <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="solicitante_apellido_paterno" 
                                        value={formData.solicitante_apellido_paterno} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
                                    <input 
                                        type="text" 
                                        name="solicitante_apellido_materno" 
                                        value={formData.solicitante_apellido_materno} 
                                        onChange={handleChange} 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="email" 
                                            name="solicitante_email" 
                                            value={formData.solicitante_email} 
                                            onChange={handleChange} 
                                            required 
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="tel" 
                                            name="solicitante_telefono" 
                                            value={formData.solicitante_telefono} 
                                            onChange={handleChange}
                                            maxLength="10"
                                            pattern="\d{10}"
                                            placeholder="5512345678"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">10 dígitos</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                                    <input 
                                        type="text" 
                                        name="solicitante_cargo" 
                                        value={formData.solicitante_cargo} 
                                        onChange={handleChange} 
                                        placeholder="Ej: Presidente Municipal" 
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección: Datos del Administrador */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                                <Shield size={20} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-800">Datos del Administrador (quien operará el sistema)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nombre <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="admin_nombre" 
                                        value={formData.admin_nombre} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Apellido Paterno <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        name="admin_apellido_paterno" 
                                        value={formData.admin_apellido_paterno} 
                                        onChange={handleChange} 
                                        required 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
                                    <input 
                                        type="text" 
                                        name="admin_apellido_materno" 
                                        value={formData.admin_apellido_materno} 
                                        onChange={handleChange} 
                                        pattern="[A-Za-zÁ-Úá-úñÑ ]+"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                    <div className="relative max-w-md">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="tel" 
                                            name="admin_telefono" 
                                            value={formData.admin_telefono} 
                                            onChange={handleChange}
                                            maxLength="10"
                                            pattern="\d{10}"
                                            placeholder="5512345678"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500" 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">10 dígitos</p>
                                </div>
                            </div>
                        </div>

                        {/* Botón de envío */}
                        <div className="pt-6 border-t border-slate-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold shadow-lg shadow-green-200 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={22} className="animate-spin" />
                                        Procesando registro...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={22} />
                                        Comenzar prueba gratuita de 30 días
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-slate-400 text-center mt-4">
                                Al registrarte aceptas nuestros términos y condiciones. No se requiere tarjeta de crédito.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;