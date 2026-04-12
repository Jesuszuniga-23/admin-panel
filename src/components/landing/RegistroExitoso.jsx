import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    CheckCircle, Mail, ArrowRight, Shield, Key, Building2
} from 'lucide-react';

const RegistroExitoso = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin_email, tenant_id, municipio_nombre, plan_nombre } = location.state || {};
    
    const [countdown, setCountdown] = useState(10);
    const [emailOfuscado, setEmailOfuscado] = useState('');

    useEffect(() => {
        if (admin_email) {
            const [usuario, dominio] = admin_email.split('@');
            const usuarioOfuscado = usuario.substring(0, 3) + '***' + usuario.substring(usuario.length - 2);
            setEmailOfuscado(`${usuarioOfuscado}@${dominio}`);
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/login', { 
                        state: { 
                            message: 'Ingresa con las credenciales enviadas a tu correo',
                            admin_email: admin_email 
                        } 
                    });
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, admin_email]);

    const handleGoToLogin = () => {
        navigate('/login', { 
            state: { 
                message: 'Ingresa con las credenciales enviadas a tu correo',
                admin_email: admin_email 
            } 
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
                    {/* Header - SOLO UN ÍCONO */}
                    <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] px-6 py-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <CheckCircle size={40} className="text-[#1E3A5F]" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">¡Registro Exitoso!</h1>
                        <p className="text-blue-100 text-sm">
                            {municipio_nombre && `Bienvenido ${municipio_nombre}`}
                        </p>
                    </div>

                    {/* Contenido - Más compacto */}
                    <div className="p-6">
                        {plan_nombre && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 size={16} className="text-[#1E3A5F]" />
                                    <span className="font-semibold text-[#1E3A5F] text-sm">Plan asignado:</span>
                                </div>
                                <p className="text-xl font-bold text-gray-900">{plan_nombre}</p>
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Prueba gratuita de 15 días activada
                                </p>
                            </div>
                        )}

                        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
                            <h2 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                <Mail size={18} className="text-amber-700" />
                                PASO IMPORTANTE: Revisa tu correo
                            </h2>
                            
                            <div className="bg-white rounded-lg p-3 mb-3 border border-amber-100">
                                <p className="text-gray-700 text-sm mb-1">
                                    Hemos enviado las credenciales de acceso al correo adjunto durante el Registro
                                </p>
                                <p className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg text-center">
                                    {emailOfuscado || admin_email}
                                </p>
                            </div>

                            <div className="space-y-2 text-sm text-amber-700">
                                <div className="flex items-start gap-2">
                                    <Key size={14} className="flex-shrink-0 mt-0.5" />
                                    <span>Encontrarás tu <strong>email de administrador</strong> y <strong>código de acceso</strong></span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Shield size={14} className="flex-shrink-0 mt-0.5" />
                                    <span>Registra tu cuenta Google e <strong>inicia sesión</strong></span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                            <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1">
                                <CheckCircle size={14} className="text-green-600" />
                                Consejos:
                            </h3>
                            <ul className="text-xs text-gray-600 space-y-1.5">
                                <li className="flex items-start gap-1.5">
                                    <span className="text-[#1E3A5F] font-bold">•</span>
                                    Revisa también <strong>SPAM</strong> o <strong>Correo no deseado</strong>
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="text-[#1E3A5F] font-bold">•</span>
                                    Si no recibes en 5 min, contacta a soporte
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={handleGoToLogin}
                                className="flex-1 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white px-4 py-3 rounded-xl font-medium text-sm hover:from-[#2A4E7A] hover:to-[#1E3A5F] transition-all inline-flex items-center justify-center gap-2 shadow-md"
                            >
                                Ir al Login
                                <ArrowRight size={16} />
                            </button>
                            <button
                                onClick={() => window.open('https://mail.google.com', '_blank')}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-[#1E3A5F] transition-all inline-flex items-center justify-center gap-2"
                            >
                                <Mail size={16} />
                                Abrir Gmail
                            </button>
                        </div>

                        <p className="text-center text-xs text-gray-500 mt-3">
                            Redirigiendo en <span className="font-bold text-[#1E3A5F]">{countdown}</span>s
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                    ¿Problemas?{' '}
                    <a href="mailto:softnovaintegradora@gmail.com" className="text-[#1E3A5F] font-medium hover:underline">
                        Contacta a soporte
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegistroExitoso;