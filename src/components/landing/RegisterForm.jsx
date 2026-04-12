import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, CheckCircle, Building2, User, Shield, MapPin, Mail, Phone, Loader2, Users,
    CreditCard, Check
} from 'lucide-react';
import registroService from '../../services/public/registro.service';
import toast from 'react-hot-toast';

const RegisterForm = ({ selectedPlan, onBack }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cpValidando, setCpValidando] = useState(false);

    const [formData, setFormData] = useState({
        // Paso 2: Municipio
        municipio_nombre: '',
        cp: '',
        estado: '',
        direccion: '',
        poblacion: selectedPlan.poblacionRecomendada || '',
        // Paso 3: Solicitante
        solicitante_nombre: '',
        solicitante_apellido_paterno: '',
        solicitante_apellido_materno: '',
        solicitante_email: '',
        solicitante_telefono: '',
        solicitante_cargo: '',
        // Paso 4: Administrador
        admin_nombre: '',
        admin_apellido_paterno: '',
        admin_apellido_materno: '',
        admin_telefono: '',
        plan_id: selectedPlan.id
    });

    const totalSteps = 4;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                toast.success(` ${info.municipio}, ${info.estado}`);
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

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await registroService.registrarMunicipio(formData);

            if (response.success) {
                const { tenant_id, admin_email, plan_asignado } = response.data;
                localStorage.setItem('tenant_id', tenant_id);

                navigate('/registro-exitoso', {
                state: {
                    admin_email: admin_email,
                    tenant_id: tenant_id,
                    municipio_nombre: formData.municipio_nombre,
                    plan_nombre: selectedPlan.nombre
                }
            });
            } else {
                // mensaje backend
                const errorMsg = response.error || 'Error al enviar solicitud';
                if (errorMsg.includes('ya está registrado')) {
                    toast.error('Este municipio ya está registrado en el sistema.');
                } else if (errorMsg.includes('poblacion')) {
                    toast.error('La población no es válida o no hay plan disponible.');
                } else {
                    toast.error(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error:', error);

            //  EXTRAER MENSAJE DEL ERROR
            const errorData = error?.response?.data || error;
            const errorMsg = errorData?.error || errorData?.message || 'Error al procesar el registro';

            if (errorMsg.includes('ya está registrado')) {
                toast.error('Este municipio ya está registrado en el sistema.');
            } else if (errorMsg.includes('poblacion') || errorMsg.includes('población')) {
                toast.error('La población ingresada no es válida.');
            } else if (errorMsg.includes('email')) {
                toast.error('El email no es válido o ya está registrado.');
            } else if (errorMsg.includes('CP') || errorMsg.includes('postal')) {
                toast.error('El código postal no es válido.');
            } else if (errorMsg.includes('plan')) {
                toast.error('No hay plan disponible para esa población.');
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Validar si el paso actual está completo
    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return true; // Siempre válido (solo confirmación)
            case 2:
                return formData.cp.length === 5 && formData.municipio_nombre && formData.estado && formData.poblacion;
            case 3:
                return formData.solicitante_nombre && formData.solicitante_apellido_paterno && formData.solicitante_email;
            case 4:
                return formData.admin_nombre && formData.admin_apellido_paterno;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Botón volver (solo en paso 1) */}
                {currentStep === 1 && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Volver a planes</span>
                    </button>
                )}

                {/* Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex flex-col items-center">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                                    ${currentStep === step ? 'bg-[#1E3A5F] text-white' :
                                        currentStep > step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                                `}>
                                    {currentStep > step ? <Check size={20} /> : step}
                                </div>
                                <span className="text-xs mt-2 text-gray-600">
                                    {step === 1 && 'Plan'}
                                    {step === 2 && 'Municipio'}
                                    {step === 3 && 'Solicitante'}
                                    {step === 4 && 'Administrador'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="relative mt-2">
                        <div className="absolute top-0 h-1 bg-gray-200 w-full rounded"></div>
                        <div
                            className="absolute top-0 h-1 bg-[#1E3A5F] rounded transition-all duration-300"
                            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Card principal */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <form onSubmit={handleSubmit}>
                        {/* ============================================= */}
                        {/* PASO 1: CONFIRMACIÓN DE PLAN */}
                        {/* ============================================= */}
                        {currentStep === 1 && (
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[#1E3A5F] p-2 rounded-lg">
                                        <CreditCard size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Confirma tu plan</h2>
                                </div>

                                <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] rounded-xl p-6 text-white mb-6">
                                    <h3 className="text-xl font-semibold">{selectedPlan.nombre}</h3>
                                    <p className="text-3xl font-bold mt-2">
                                        ${selectedPlan.precio_mensual?.toLocaleString()} MXN <span className="text-lg font-normal opacity-80">/mes</span>
                                    </p>
                                    <p className="text-sm opacity-80 mt-1">
                                        Para municipios de {selectedPlan.poblacion_min?.toLocaleString()}
                                        a {selectedPlan.poblacion_max === 999999999 ? 'más de 50,000' : selectedPlan.poblacion_max?.toLocaleString()} habitantes
                                    </p>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 mb-6">
                                    <h4 className="font-semibold text-blue-800 mb-3">Incluye:</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm">{selectedPlan.max_admin || '∞'} Administradores</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm">Policías/Paramédicos ILIMITADOS</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm">Unidades ILIMITADAS</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span className="text-sm">Alertas ILIMITADAS</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Población registrada:</span>
                                        <span className="font-semibold text-gray-800">{formData.poblacion?.toLocaleString()} habitantes</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-gray-600">Prueba gratuita:</span>
                                        <span className="font-semibold text-green-600">{selectedPlan.trial_dias} días</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-gray-600">Sin tarjeta de crédito:</span>
                                        <span className="font-semibold text-green-600"> Sí</span>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-[#1E3A5F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2A4E7A] transition-all inline-flex items-center gap-2"
                                    >
                                        Siguiente: Datos del Municipio
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* PASO 2: DATOS DEL MUNICIPIO */}
                        {/* ============================================= */}
                        {currentStep === 2 && (
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[#1E3A5F] p-2 rounded-lg">
                                        <Building2 size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Datos del Municipio</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
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
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                            />
                                            {cpValidando && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 size={18} className="animate-spin text-[#1E3A5F]" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Ingresa 5 dígitos para autocompletar</p>
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
                                                readOnly
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-50"
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

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            placeholder="Calle, número, colonia (opcional)"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Población <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                name="poblacion"
                                                value={formData.poblacion}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-slate-100"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1"> Población calculada en la página anterior</p>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-2"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!isStepValid()}
                                        className="bg-[#1E3A5F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2A4E7A] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente: Solicitante
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* PASO 3: DATOS DEL SOLICITANTE */}
                        {/* ============================================= */}
                        {currentStep === 3 && (
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[#1E3A5F] p-2 rounded-lg">
                                        <User size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Datos del Solicitante</h2>
                                    <span className="text-sm text-gray-500 ml-2">(quien contrata el servicio)</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
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
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
                                        <input
                                            type="text"
                                            name="solicitante_apellido_materno"
                                            value={formData.solicitante_apellido_materno}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                        />
                                    </div>

                                    <div>
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
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
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
                                                placeholder="5512345678"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                                        <input
                                            type="text"
                                            name="solicitante_cargo"
                                            value={formData.solicitante_cargo}
                                            onChange={handleChange}
                                            placeholder="Ej: Presidente Municipal"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-2"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!isStepValid()}
                                        className="bg-[#1E3A5F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#2A4E7A] transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente: Administrador
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* PASO 4: DATOS DEL ADMINISTRADOR */}
                        {/* ============================================= */}
                        {currentStep === 4 && (
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[#1E3A5F] p-2 rounded-lg">
                                        <Shield size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Datos del Administrador</h2>
                                    <span className="text-sm text-gray-500 ml-2">(quien operará el sistema)</span>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        El administrador recibirá un email con sus credenciales de acceso.
                                        Deberá crear una cuenta de Google con el email que se generará automáticamente.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
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
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Apellido Materno</label>
                                        <input
                                            type="text"
                                            name="admin_apellido_materno"
                                            value={formData.admin_apellido_materno}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="tel"
                                                name="admin_telefono"
                                                value={formData.admin_telefono}
                                                onChange={handleChange}
                                                maxLength="10"
                                                placeholder="5512345678"
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 mt-6">
                                    <h4 className="font-semibold text-gray-800 mb-2"> Resumen final</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Plan:</strong> {selectedPlan.nombre} (${selectedPlan.precio_mensual?.toLocaleString()}/mes)</p>
                                        <p><strong>Municipio:</strong> {formData.municipio_nombre}, {formData.estado}</p>
                                        <p><strong>Población:</strong> {formData.poblacion?.toLocaleString()} habitantes</p>
                                        <p><strong>Solicitante:</strong> {formData.solicitante_nombre} {formData.solicitante_apellido_paterno}</p>
                                        <p><strong>Administrador:</strong> {formData.admin_nombre} {formData.admin_apellido_paterno}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-2"
                                    >
                                        <ArrowLeft size={18} />
                                        Volver
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !isStepValid()}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={20} />
                                                Completar registro
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;