import { useState } from 'react';
import { Shield, Building2, Users, Truck, Bell, CheckCircle, ArrowRight, MapPin, Clock, Zap } from 'lucide-react';
import RegisterForm from '../components/landing/RegisterForm';

const LandingPage = () => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const planes = [
        { 
            id: 'basico', 
            nombre: 'Básico', 
            precio: '$199', 
            periodo: 'mes',
            features: ['10 usuarios operativos', '5 unidades', '500 alertas/mes', 'Soporte email'],
            popular: false,
            color: 'from-blue-500 to-blue-600',
            borderColor: 'border-blue-200',
            buttonColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        },
        { 
            id: 'premium', 
            nombre: 'Premium', 
            precio: '$499', 
            periodo: 'mes',
            features: ['50 usuarios operativos', '20 unidades', '2,000 alertas/mes', 'Soporte prioritario', 'API acceso'],
            popular: true,
            color: 'from-purple-500 to-purple-600',
            borderColor: 'border-purple-300',
            buttonColor: 'bg-purple-600 text-white hover:bg-purple-700'
        },
        { 
            id: 'enterprise', 
            nombre: 'Enterprise', 
            precio: 'Personalizado', 
            periodo: '',
            features: ['Usuarios ilimitados', 'Unidades ilimitadas', 'Alertas ilimitadas', 'Soporte 24/7', 'API dedicada'],
            popular: false,
            color: 'from-gray-700 to-gray-800',
            borderColor: 'border-gray-300',
            buttonColor: 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }
    ];

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (showForm && selectedPlan) {
        return <RegisterForm selectedPlan={selectedPlan} onBack={() => setShowForm(false)} />;
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Emergencias MVP
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-gray-600 hover:text-gray-800 font-medium transition-colors">
                            Iniciar sesión
                        </a>
                        <a href="#planes" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200">
                            Comenzar prueba
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Zap size={16} />
                            30 días de prueba gratis • Sin tarjeta de crédito
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Sistema de Emergencias{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                para Municipios
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                            Protege a tus ciudadanos con alertas en tiempo real. Gestiona policías, paramédicos y unidades desde un solo lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="#planes" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-200 inline-flex items-center justify-center gap-2">
                                Comenzar prueba gratis
                                <ArrowRight size={20} />
                            </a>
                            <a href="#features" className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                                Conocer más
                            </a>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
                        <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                            <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                            <p className="text-3xl font-bold text-gray-800">50+</p>
                            <p className="text-gray-500">Municipios activos</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                            <Bell className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                            <p className="text-3xl font-bold text-gray-800">10k+</p>
                            <p className="text-gray-500">Alertas gestionadas</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
                            <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                            <p className="text-3xl font-bold text-gray-800">5k+</p>
                            <p className="text-gray-500">Personal operativo</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Todo lo que necesitas para gestionar emergencias
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Una plataforma completa diseñada para la seguridad pública municipal
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100">
                            <div className="bg-blue-600 p-3 rounded-xl inline-block mb-4">
                                <Bell className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Alertas en tiempo real</h3>
                            <p className="text-gray-600">
                                Recibe y gestiona alertas de pánico y médicas al instante. Asigna unidades automáticamente.
                            </p>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100">
                            <div className="bg-purple-600 p-3 rounded-xl inline-block mb-4">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Gestión de unidades</h3>
                            <p className="text-gray-600">
                                Control total de patrullas y ambulancias. Asigna personal, monitorea ubicación y disponibilidad.
                            </p>
                        </div>
                        <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
                            <div className="bg-indigo-600 p-3 rounded-xl inline-block mb-4">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Personal operativo</h3>
                            <p className="text-gray-600">
                                Administra policías y paramédicos. Control de turnos, disponibilidad y asignaciones.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Planes Section */}
            <section id="planes" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Planes para tu municipio
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Selecciona el plan que mejor se adapte a tus necesidades. Todos incluyen 30 días de prueba gratis.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {planes.map((plan) => (
                            <div 
                                key={plan.id}
                                className={`bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl ${plan.popular ? 'border-2 border-purple-400 relative' : 'border border-gray-200'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                                        Más popular
                                    </div>
                                )}
                                <div className={`bg-gradient-to-r ${plan.color} p-6 text-white`}>
                                    <h3 className="text-2xl font-bold">{plan.nombre}</h3>
                                    <div className="mt-3">
                                        <span className="text-4xl font-bold">{plan.precio}</span>
                                        {plan.periodo && <span className="text-sm opacity-80">/{plan.periodo}</span>}
                                    </div>
                                    <p className="text-sm opacity-90 mt-1">+ IVA</p>
                                </div>
                                <div className="p-6">
                                    <ul className="space-y-4 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button 
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${plan.buttonColor}`}
                                    >
                                        Seleccionar plan
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-500 text-sm">
                            ¿Necesitas algo más específico?{' '}
                            <a href="#" className="text-blue-600 hover:underline font-medium">Contáctanos</a>
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        ¿Listo para proteger tu municipio?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Comienza tu prueba gratuita de 30 días. Sin tarjeta de crédito.
                    </p>
                    <a href="#planes" className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-xl inline-flex items-center gap-2">
                        Comenzar ahora
                        <ArrowRight size={20} />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-6 w-6 text-blue-400" />
                                <span className="font-bold text-lg">Emergencias MVP</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Sistema de gestión de emergencias para municipios.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Producto</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
                                <li><a href="#planes" className="hover:text-white transition-colors">Planes</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Seguridad</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Soporte</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentación</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                        © 2026 Sistema de Emergencias. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;