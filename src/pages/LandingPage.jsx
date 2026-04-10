import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useScroll, useTransform } from 'framer-motion';
import {
    Shield, Building2, Users, Truck, Bell, CheckCircle, ArrowRight,
    Zap, Lock, Activity, BarChart3, ChevronRight, Loader2,
    MapPin, FileText, Smartphone, LayoutDashboard, TrendingUp,
    Hexagon, BadgeCheck, Siren
} from 'lucide-react';
import RegisterForm from '../components/landing/RegisterForm';
import registroService from '../services/public/registro.service';
import toast from 'react-hot-toast';

// Importación directa de imágenes (Vite)
import heroBg from '../assets/images/landing/hero-bg.jpeg';
import dashboardPreview from '../assets/images/landing/dashboard-preview.png';
import mapLocation from '../assets/images/landing/mapLocation.png';
import personalInscrito from '../assets/images/landing/personalInscrito.png';
import reportesSistema from '../assets/images/landing/ReportesSistema.png';
import appCiudadano from '../assets/images/landing/appCiudadano.jpeg';

// --- Componente de Animación (FadeInSection) - SIN ERRORES ---
const FadeInSection = ({ children, delay = 0, direction = 'up' }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.2 });

    useEffect(() => {
        if (inView) controls.start('visible');
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, y: direction === 'up' ? 30 : -30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1 }
    };

    return (
        <motion.div
            ref={ref}
            animate={controls}
            initial="hidden"
            transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
            variants={variants}
        >
            {children}
        </motion.div>
    );
};

// --- Componente de Conteo Animado - SIN ERRORES ---
const AnimatedCounter = ({ value, suffix = '', duration = 2 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const end = parseInt(value, 10);
        if (start === end) return;
        const incrementTime = (duration / end) * 1000;
        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === end) clearInterval(timer);
        }, incrementTime);
        return () => clearInterval(timer);
    }, [value, duration, inView]);

    return <span ref={ref}>{count}{suffix}</span>;
};

// --- PALETA DE COLORES "POLICÍA MEXICANO / SOFTNOVA" ---
const getPlanColors = (index) => {
    const colorSchemes = [
        { gradient: 'from-[#1A1A1A] to-[#2D2D2D]', bgLight: 'bg-gray-100', border: 'border-gray-300', button: 'bg-white text-gray-800 border border-gray-400 hover:bg-gray-100' },
        { gradient: 'from-[#1E3A5F] to-[#0F2440]', bgLight: 'bg-blue-50/30', border: 'border-blue-300', button: 'bg-[#1E3A5F] text-white hover:bg-[#0F2440]' },
        { gradient: 'from-[#2B2B2B] to-[#000000]', bgLight: 'bg-gray-50', border: 'border-gray-400', button: 'bg-white text-gray-900 border border-gray-500 hover:bg-gray-200' }
    ];
    return colorSchemes[index % colorSchemes.length];
};

const LandingPage = () => {
    const [planes, setPlanes] = useState([]);
    const [loadingPlanes, setLoadingPlanes] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);

    useEffect(() => {
        const cargarPlanes = async () => {
            try {
                setLoadingPlanes(true);
                const response = await registroService.obtenerPlanes();
                if (response.success && response.data) {
                    setPlanes(response.data.sort((a, b) => (a.precio_mensual || 0) - (b.precio_mensual || 0)));
                } else {
                    toast.error('Error al cargar las capacidades');
                }
            } catch (error) {
                console.error('Error cargando planes:', error);
            } finally {
                setLoadingPlanes(false);
            }
        };
        cargarPlanes();
    }, []);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (showForm && selectedPlan) {
        return <RegisterForm selectedPlan={selectedPlan} onBack={() => setShowForm(false)} />;
    }

    return (
        <div className="min-h-screen bg-white font-sans antialiased selection:bg-[#1E3A5F] selection:text-white">
            {/* --- HEADER SOFTNOVA --- */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 bg-[#0F0F0F]/90 backdrop-blur-md z-50 border-b border-[#1E3A5F]/30"
            >
                <div className="container mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#1E3A5F] p-2 rounded shadow-md">
                            <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-white tracking-tight">SOFTNOVA</span>
                            <span className="text-xs text-gray-400 -mt-1">Protección Civil</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="/login" className="text-gray-300 hover:text-white font-medium transition-colors text-sm">Acceso</a>
                        <a href="#planes" className="px-5 py-2 bg-[#1E3A5F] text-white rounded text-sm font-medium hover:bg-[#2A4E7A] transition-all shadow-sm">Demostración</a>
                    </div>
                </div>
            </motion.header>

            {/* --- HERO CON NUEVA IMAGEN --- */}
            {/* --- HERO CON NUEVA IMAGEN --- */}
            <section className="relative h-screen flex items-center overflow-hidden">
                <motion.div
                    style={{
                        y: heroY,
                        backgroundImage: `url(${heroBg})`
                    }}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 w-full">
                    <FadeInSection>
                        <div className="inline-flex items-center gap-2 bg-[#1E3A5F]/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium mb-8 border border-[#1E3A5F]">
                            <Siren size={14} className="text-blue-300" /> RESPUESTA INMEDIATA • TECNOLOGÍA SOFTNOVA
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight max-w-5xl">
                            Coordinación táctica para la{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A5F] to-white">Seguridad Pública</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light">
                            La plataforma que integra a sus elementos, unidades y ciudadanos para una respuesta más rápida y decisiones más inteligentes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <a href="#capacidades" className="px-8 py-4 bg-[#1E3A5F] text-white rounded font-semibold text-base hover:bg-[#2A4E7A] transition-all shadow-xl inline-flex items-center gap-2">
                                Explorar Capacidades <ArrowRight size={18} />
                            </a>
                            <a href="#planes" className="px-8 py-4 bg-transparent text-white border border-gray-500 rounded font-medium text-base hover:bg-white/5 backdrop-blur-sm">Ver Planes</a>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- MÉTRICAS (SOCIAL PROOF) --- */}
            <section className="py-16 px-6 lg:px-8 bg-white border-b border-gray-200">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <FadeInSection delay={0.1}>
                            <Building2 className="h-8 w-8 text-[#1E3A5F] mx-auto mb-3" />
                            <div className="text-3xl font-bold text-gray-900"><AnimatedCounter value="50" />+</div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Municipios</p>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <Activity className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-gray-900"><AnimatedCounter value="99.9" />%</div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Disponibilidad</p>
                        </FadeInSection>
                        <FadeInSection delay={0.3}>
                            <TrendingUp className="h-8 w-8 text-[#1E3A5F] mx-auto mb-3" />
                            <div className="text-3xl font-bold text-gray-900"><AnimatedCounter value="30" />%</div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Respuesta Más Rápida*</p>
                        </FadeInSection>
                        <FadeInSection delay={0.4}>
                            <Lock className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-gray-900">100%</div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider">Cifrado de Datos</p>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 1: PANEL DE CONTROL --- */}
            <section id="capacidades" className="py-28 px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <FadeInSection>
                            <div className="bg-[#1E3A5F]/10 p-3 rounded-lg inline-block mb-6">
                                <LayoutDashboard size={24} className="text-[#1E3A5F]" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-tight">Centro de Mando Unificado.</h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">Consolide la información de todas sus operaciones en una única vista táctica. Monitoree incidentes, gestione recursos y coordine equipos en tiempo real.</p>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Vista de KPIs:</span><span className="text-gray-600"> Personal, unidades y alertas en un solo vistazo.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Seguimiento de Incidentes:</span><span className="text-gray-600"> Desde que se reportan hasta su cierre.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Disponibilidad en Vivo:</span><span className="text-gray-600"> Sepa qué recursos están listos para actuar.</span></div></li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div>
                                    <span className="text-xs text-gray-400 flex-1 text-center">Panel de Control - Protección Civil</span>
                                </div>
                                <img src={dashboardPreview} alt="Dashboard" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 2: MAPA DE ALERTAS --- */}
            <section className="py-28 px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <FadeInSection delay={0.2} className="order-2 md:order-1">
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-red-900 to-amber-900 rounded-2xl blur-xl opacity-20 group-hover:opacity-40"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div>
                                    <span className="text-xs text-gray-400 flex-1 text-center">Mapa de Incidentes - Vista en Tiempo Real</span>
                                </div>
                                <img src={mapLocation} alt="Mapa" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                        <FadeInSection className="order-1 md:order-2">
                            <div className="bg-red-100 p-3 rounded-lg inline-block mb-6"><MapPin size={24} className="text-red-800" /></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Geolocalización de Precisión.</h2>
                            <p className="text-lg text-gray-600 mb-8">Cada alerta se geolocaliza al instante, permitiendo identificar el incidente y desplegar la unidad más cercana.</p>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Visualización en Tiempo Real:</span><span className="text-gray-600"> Incidentes reportados por ciudadanos y unidades.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Categorización por Tipo:</span><span className="text-gray-600"> Pánico (Negro), Médica (Verde).</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Optimización de Rutas:</span><span className="text-gray-600"> Reduzca los tiempos de llegada.</span></div></li>
                            </ul>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 3: APP CIUDADANO --- */}
            <section className="py-28 px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <FadeInSection>
                            <div className="bg-emerald-100 p-3 rounded-lg inline-block mb-6"><Smartphone size={24} className="text-emerald-800" /></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">El Poder de la Ciudadanía.</h2>
                            <p className="text-lg text-gray-600 mb-8">Convierta a cada ciudadano en un aliado. Los reportes fluyen directamente a su panel con ubicación y tipo de incidente.</p>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Reporte Simplificado:</span><span className="text-gray-600"> El ciudadano reporta en segundos.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Geolocalización Automática:</span><span className="text-gray-600"> Ubicación precisa sin intervención.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Seguimiento de Estatus:</span><span className="text-gray-600"> El ciudadano sabe que es atendido.</span></div></li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.05, rotate: -1 }} className="relative group flex justify-center">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-900 to-green-900 rounded-3xl blur-xl opacity-20 group-hover:opacity-40"></div>
                                <div className="relative rounded-3xl shadow-2xl border border-gray-200 overflow-hidden bg-black"><img src={appCiudadano} alt="App Ciudadano" className="relative w-full h-auto max-w-xs" /></div>
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- PLANES --- */}
            <section id="planes" className="py-28 px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-7xl">
                    <FadeInSection>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Capacidades que se adaptan a su operación.</h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Seleccione el nivel de capacidad y solicite una demostración de valor personalizada.</p>
                        </div>
                    </FadeInSection>
                    {loadingPlanes ? (
                        <div className="flex justify-center items-center py-20"><Loader2 size={40} className="animate-spin text-[#1E3A5F]" /></div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-10">
                            {planes.map((plan, index) => {
                                const colors = getPlanColors(index);
                                const esPopular = index === 1;
                                return (
                                    <FadeInSection key={plan.id} delay={index * 0.1}>
                                        <motion.div whileHover={{ y: -8 }} className={`relative bg-white rounded-lg shadow-xl overflow-hidden h-full flex flex-col border ${esPopular ? 'border-[#1E3A5F] ring-1 ring-[#1E3A5F]/20' : 'border-gray-200'}`}>
                                            {esPopular && (<div className="absolute top-4 right-4 bg-[#1E3A5F] text-white text-xs px-3 py-1 rounded-full font-medium z-10">Mayor Valor</div>)}
                                            <div className={`bg-gradient-to-r ${colors.gradient} p-8 text-white`}>
                                                <h3 className="text-2xl font-semibold">{plan.nombre}</h3>
                                                <div className="mt-4"><span className="text-4xl font-bold">{plan.precio_mensual ? `$${plan.precio_mensual}` : 'Personalizado'}</span>{plan.precio_mensual && <span className="text-sm opacity-80">/mes</span>}</div>
                                                <p className="text-sm opacity-80 mt-1">+ IVA</p>
                                                {/* ✅ NUEVO: Población objetivo */}
                                                <p className="text-xs bg-white/20 rounded px-2 py-1 mt-2 inline-block">
                                                    {plan.poblacion_min === 0 ? 'Hasta' : 'Desde'} {plan.poblacion_max === 999999999 ? 'más de 50,000' : `${plan.poblacion_max?.toLocaleString()}`} hab.
                                                </p>
                                            </div>
                                            <div className="p-8 flex-1 flex flex-col">
                                                <div className="bg-gray-100 p-5 rounded-lg mb-6 border border-gray-200">
                                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase flex items-center gap-2">
                                                        <CheckCircle size={16} className="text-emerald-700" />Capacidades del plan
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        <li className="flex justify-between text-sm">
                                                            <span>Administradores:</span>
                                                            <span className="font-semibold">{plan.max_admin || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Operadores Técnicos:</span>
                                                            <span className="font-semibold">{plan.max_tecnico || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Operadores Médicos:</span>
                                                            <span className="font-semibold">{plan.max_medico || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Operadores Policiales:</span>
                                                            <span className="font-semibold">{plan.max_policial || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Operadores Generales:</span>
                                                            <span className="font-semibold">{plan.max_general || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Prueba gratuita:</span>
                                                            <span className="font-semibold text-emerald-700">{plan.trial_dias || 30} días</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                                            <span>Policías / Paramédicos:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADOS</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Unidades:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADAS</span>
                                                        </li>
                                                        <li className="flex justify-between text-sm">
                                                            <span>Alertas:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADAS</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <button onClick={() => handleSelectPlan(plan)} className={`w-full py-3.5 rounded font-semibold flex items-center justify-center gap-2 mt-auto ${colors.button} group`}>Solicitar Demostración <ArrowRight size={18} className="group-hover:translate-x-1" /></button>
                                            </div>
                                        </motion.div>
                                    </FadeInSection>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* --- SECCIÓN 4: GESTIÓN DE EQUIPOS --- */}
            <section className="py-28 px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <FadeInSection>
                            <div className="bg-amber-100 p-3 rounded-lg inline-block mb-6"><Users size={24} className="text-amber-800" /></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Gestión de Capital Humano.</h2>
                            <p className="text-lg text-gray-600 mb-8">Registro y control de todo su personal operativo: policías, paramédicos y administradores. Gestione turnos, disponibilidad y asignaciones.</p>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Directorio Completo:</span><span className="text-gray-600"> Información de contacto y roles.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Disponibilidad en Tiempo Real:</span><span className="text-gray-600"> Sepa quién está listo.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Asignación Dinámica:</span><span className="text-gray-600"> Optimice la composición de equipos.</span></div></li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-900 to-orange-900 rounded-2xl blur-xl opacity-20"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-3 flex items-center gap-2 border-b border-gray-700"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div><span className="text-xs text-gray-400 flex-1 text-center">Gestión de Personal Operativo</span></div>
                                <img src={personalInscrito} alt="Personal" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 5: REPORTES --- */}
            <section className="py-28 px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <FadeInSection delay={0.2} className="order-2 md:order-1">
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F] to-cyan-900 rounded-2xl blur-xl opacity-20"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-3 flex items-center gap-2 border-b border-gray-700"><div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div></div><span className="text-xs text-gray-400 flex-1 text-center">Generación de Reportes</span></div>
                                <img src={reportesSistema} alt="Reportes" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                        <FadeInSection className="order-1 md:order-2">
                            <div className="bg-cyan-100 p-3 rounded-lg inline-block mb-6"><FileText size={24} className="text-cyan-800" /></div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Decisiones Basadas en Evidencia.</h2>
                            <p className="text-lg text-gray-600 mb-8">Genere reportes detallados sobre desempeño del personal, utilización de unidades e histórico de alertas.</p>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Efectividad de Respuesta:</span><span className="text-gray-600"> Mida tiempos y resolución.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Incidentes por Zona:</span><span className="text-gray-600"> Identifique patrones y áreas de riesgo.</span></div></li>
                                <li className="flex items-start gap-4"><div className="bg-emerald-100 p-2 rounded-full"><CheckCircle size={18} className="text-emerald-700" /></div><div><span className="font-semibold text-gray-800">Exportación a PDF/Excel:</span><span className="text-gray-600"> Comparta información fácilmente.</span></div></li>
                            </ul>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-28 px-6 lg:px-8 bg-[#0F0F0F]">
                <div className="container mx-auto max-w-4xl text-center">
                    <FadeInSection>
                        <BadgeCheck size={48} className="text-[#1E3A5F] mx-auto mb-6" />
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Modernice la seguridad de su municipio.</h2>
                        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">Nuestro equipo de especialistas está listo para ofrecerle una demostración personalizada.</p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <a href="#planes" className="px-8 py-4 bg-[#1E3A5F] text-white rounded font-semibold text-base hover:bg-[#2A4E7A] transition-all inline-flex items-center gap-2">Solicitar Demostración <ChevronRight size={20} /></a>
                            <a href="mailto:contacto@softnova.mx" className="px-8 py-4 bg-transparent text-white border border-gray-600 rounded font-medium text-base hover:bg-white/5">Contactar a SoftNova</a>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- FOOTER SOFTNOVA --- */}
            <footer className="bg-black text-white py-12 px-6 lg:px-8 border-t border-gray-800">
                <div className="container mx-auto max-w-6xl text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Hexagon size={24} className="text-[#1E3A5F]" fill="currentColor" />
                        <span className="font-bold text-xl tracking-tight">SOFTNOVA</span>
                    </div>
                    <p className="text-gray-500 text-sm">Tecnología para la Protección Civil. © 2026 SoftNova. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;