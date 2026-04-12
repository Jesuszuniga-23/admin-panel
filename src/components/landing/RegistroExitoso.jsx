import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    CheckCircle, Mail, ArrowRight, Shield, Key, Clock, Building2 
} from 'lucide-react';

const RegistroExitoso = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin_email, tenant_id, municipio_nombre, plan_nombre } = location.state || {};
    
    const [countdown, setCountdown] = useState(10);
    const [emailOfuscado, setEmailOfuscado] = useState('');

    useEffect(() => {
        // Ofuscar email para mostrar
        if (admin_email) {
            const [usuario, dominio] = admin_email.split('@');
            const usuarioOfuscado = usuario.substring(0, 3) + '***' + usuario.substring(usuario.length - 2);
            setEmailOfuscado(`${usuarioOfuscado}@${dominio}`);
        }

        // Auto-redirección después de 10 segundos
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
            <div className="max-w-2xl w-full">
                {/* Animación de éxito */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-green-100">
                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">¡Registro Exitoso!</h1>
                        <p className="text-green-50 text-lg">
                            {municipio_nombre && `Bienvenido ${municipio_nombre}`}
                        </p>
                    </div>

                    {/* Contenido */}
                    <div className="p-8">
                        {/* Plan asignado */}
                        {plan_nombre && (
                            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 size={18} className="text-blue-600" />
                                    <span className="font-semibold text-blue-800">Plan asignado:</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{plan_nombre}</p>
                                <p className="text-sm text-blue-600 mt-1">Prueba gratuita de 15 días activada</p>
                            </div>
                        )}

                        {/* Instrucciones principales */}
                        <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-200">
                            <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                                <Mail size={20} />
                                 PASO IMPORTANTE: Revisa tu correo
                            </h2>
                            
                            <div className="bg-white rounded-lg p-4 mb-4">
                                <p className="text-gray-700 mb-2">
                                    Hemos enviado las credenciales de acceso a:
                                </p>
                                <p className="text-xl font-mono font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-lg text-center">
                                    {emailOfuscado || admin_email}
                                </p>
                            </div>

                            <div className="space-y-3 text-sm text-amber-700">
                                <div className="flex items-start gap-3">
                                    <Key size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>Encontrarás tu <strong>email de administrador</strong> y <strong>codigo de acceso para Ciudadanos de tu Municipio</strong></span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Shield size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>Deberas registrar tu cuenta Google.<strong> Posteriormente inicia Sesion.</strong></span>
                                </div>
                                
                            </div>
                        </div>

                        {/* Tips adicionales */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <h3 className="font-semibold text-gray-700 mb-2">Consejos:</h3>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">•</span>
                                    Revisa también la bandeja de <strong>SPAM</strong> o <strong>Correo no deseado</strong>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">•</span>
                                    Si no recibes el correo en 5 minutos, contacta a soporte
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500">•</span>
                                    Guarda este correo para futuras referencias
                                </li>
                            </ul>
                        </div>

                        {/* Botones */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleGoToLogin}
                                className="flex-1 bg-gradient-to-r from-[#1E3A5F] to-[#2A4E7A] text-white px-6 py-4 rounded-xl font-semibold hover:from-[#2A4E7A] hover:to-[#3A5E8A] transition-all inline-flex items-center justify-center gap-2 shadow-lg"
                            >
                                Ir al Login
                                <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={() => window.open('https://mail.google.com', '_blank')}
                                className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2"
                            >
                                <Mail size={18} />
                                Abrir Gmail
                            </button>
                        </div>

                        {/* Auto-redirección */}
                        <p className="text-center text-sm text-gray-500 mt-4">
                            Serás redirigido automáticamente en <span className="font-bold text-[#1E3A5F]">{countdown}</span> segundos
                        </p>
                    </div>
                </div>

                {/* Información de contacto */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿Problemas con el registro? {' '}
                    <a href="softnovaintegradora@gmail.com" className="text-[#1E3A5F] font-medium hover:underline">
                        Contacta a soporte
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegistroExitoso;