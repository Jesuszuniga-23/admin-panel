import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useScroll, useTransform } from 'framer-motion';
import {
    Shield, Building2, Users, Truck, Bell, CheckCircle, ArrowRight,
    Zap, Lock, Activity, ChevronRight, Loader2,
    MapPin, FileText, Smartphone, LayoutDashboard, TrendingUp,
    Hexagon, BadgeCheck, Siren, Calculator, Target, Award,
    Clock, AlertTriangle, Radio, Eye, Globe, Sparkles
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

// --- Componente de Animación ---
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

// --- Componente de Conteo Animado ---
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

// --- Paleta de colores para planes ---
const getPlanColors = (index) => {
    const colorSchemes = [
        { gradient: 'from-gray-800 to-gray-900', bgLight: 'bg-gray-100', border: 'border-gray-300', button: 'bg-white text-gray-800 border border-gray-400 hover:bg-gray-100', accent: 'text-gray-600' },
        { gradient: 'from-[#1E3A5F] to-[#0F2440]', bgLight: 'bg-blue-50/30', border: 'border-blue-300', button: 'bg-[#1E3A5F] text-white hover:bg-[#0F2440]', accent: 'text-[#1E3A5F]' },
        { gradient: 'from-[#2B2B2B] to-[#000000]', bgLight: 'bg-gray-50', border: 'border-gray-400', button: 'bg-white text-gray-900 border border-gray-500 hover:bg-gray-200', accent: 'text-gray-700' }
    ];
    return colorSchemes[index % colorSchemes.length];
};

// --- Componente de Característica Destacada ---
const FeatureCard = ({ icon: Icon, title, description, color }) => {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/20 text-blue-600',
        red: 'from-red-500/20 to-red-600/20 text-red-600',
        emerald: 'from-emerald-500/20 to-emerald-600/20 text-emerald-600',
        amber: 'from-amber-500/20 to-amber-600/20 text-amber-600',
        purple: 'from-purple-500/20 to-purple-600/20 text-purple-600',
    };

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
        >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4`}>
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
};

const LandingPage = () => {
    const [planes, setPlanes] = useState([]);
    const [loadingPlanes, setLoadingPlanes] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [poblacionConsulta, setPoblacionConsulta] = useState('');
    const [planRecomendado, setPlanRecomendado] = useState(null);
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
        setSelectedPlan({
            ...plan,
            poblacionRecomendada: poblacionConsulta || null
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const calcularPlanRecomendado = () => {
        const pob = parseInt(poblacionConsulta) || 0;
        if (pob <= 0) {
            toast.error('Ingresa una población válida');
            return;
        }
        const plan = planes.find(p => pob >= p.poblacion_min && pob <= p.poblacion_max);
        if (plan) {
            setPlanRecomendado(plan);
            toast.success(`Plan recomendado: ${plan.nombre}`);
        } else {
            toast.error('No hay un plan disponible para esa población');
        }
    };

    if (showForm && selectedPlan) {
        return <RegisterForm selectedPlan={selectedPlan} onBack={() => setShowForm(false)} />;
    }

    return (
        <div className="min-h-screen bg-white font-sans antialiased selection:bg-[#1E3A5F] selection:text-white">
            {/* --- HEADER OPTIMIZADO --- */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 bg-[#0F0F0F]/95 backdrop-blur-md z-50 border-b border-[#1E3A5F]/30"
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2440] p-2 rounded-lg shadow-lg">
                            <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base sm:text-lg font-bold text-white tracking-tight">SECURITY APP</span>
                            <span className="text-[8px] sm:text-[10px] text-gray-400 -mt-0.5">by SoftNova</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <a href="/login" className="text-gray-300 hover:text-white font-medium transition-colors text-xs sm:text-sm">Acceso</a>
                        <a href="#planes" className="px-4 sm:px-5 py-2 bg-[#1E3A5F] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#2A4E7A] transition-all shadow-md">
                            Demo
                        </a>
                    </div>
                </div>
            </motion.header>

            {/* --- HERO - IMPACTO INMEDIATO --- */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                <motion.div
                    style={{ y: heroY, backgroundImage: `url(${heroBg})` }}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg...%3E')] opacity-10" />
                
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-0">
                    <FadeInSection>
                        {/* Badge de Urgencia */}
                        <div className="inline-flex items-center gap-2 bg-red-600/20 backdrop-blur-sm text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium mb-6 sm:mb-8 border border-red-500/50 animate-pulse">
                            <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5 text-red-400" /> 
                            CADA SEGUNDO CUENTA • RESPUESTA INMEDIATA
                        </div>
                        
                        {/* TÍTULO PRINCIPAL - Alto Impacto */}
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-[1.1] sm:leading-tight tracking-tight max-w-5xl">
                            <span className="block">Plataforma de Comando</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#1E3A5F] to-white">
                                 y Control Unificado
                            </span>
                        </h1>
                        
                        {/* Subtítulo Persuasivo */}
                        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
                            Centraliza emergencias, coordina unidades en tiempo real y reduce 
                            <span className="text-white font-semibold"> hasta un 30% el tiempo de respuesta</span> de tu corporación.
                        </p>

                        {/* Beneficios Clave (Visibles inmediatamente) */}
                        <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 sm:mb-10">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-gray-300 text-xs sm:text-sm">Sin instalación</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-gray-300 text-xs sm:text-sm">Prueba gratuita en todos los planes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-gray-300 text-xs sm:text-sm">Soporte 24/7</span>
                            </div>
                        </div>
                        
                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <a 
                                href="#capacidades" 
                                className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-2xl hover:shadow-[#1E3A5F]/50 transition-all inline-flex items-center justify-center gap-2 border border-white/10"
                            >
                                Ver cómo funciona
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a 
                                href="#planes" 
                                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-xl font-medium text-sm sm:text-base hover:bg-white/20 transition-all text-center"
                            >
                                Ver planes y precios
                            </a>
                        </div>
                    </FadeInSection>
                </div>

                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hidden sm:block"
                >
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                        <div className="w-1 h-2 bg-white/60 rounded-full mt-2" />
                    </div>
                </motion.div>
            </section>

            {/* --- PROBLEMA QUE RESOLVEMOS (NUEVA SECCIÓN) --- */}
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <FadeInSection>
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                ¿Tu municipio enfrenta estos problemas?
                            </h2>
                            <p className="text-gray-600 text-base sm:text-lg max-w-3xl mx-auto">
                                La falta de coordinación cuesta vidas. Security App resuelve esto.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <FadeInSection delay={0.1}>
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <Clock size={28} className="text-red-500 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Respuesta Lenta</h3>
                                <p className="text-gray-600 text-sm">Alertas que tardan en llegar al personal adecuado.</p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <Radio size={28} className="text-amber-500 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Falta de Comunicación</h3>
                                <p className="text-gray-600 text-sm">Policía, ambulancias y protección civil descoordinados.</p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.3}>
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <Eye size={28} className="text-blue-500 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Cero Visibilidad</h3>
                                <p className="text-gray-600 text-sm">Sin saber dónde están tus unidades en tiempo real.</p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.4}>
                            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                                <FileText size={28} className="text-purple-500 mb-3" />
                                <h3 className="font-bold text-gray-900 mb-2">Reportes Manuales</h3>
                                <p className="text-gray-600 text-sm">Horas perdidas en papeleo en lugar de acción.</p>
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- MÉTRICAS (SOCIAL PROOF) --- */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-200">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                        <FadeInSection delay={0.1}>
                            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E3A5F] mx-auto mb-2 sm:mb-3" />
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900"><AnimatedCounter value="50" />+</div>
                            <p className="text-gray-500 text-[10px] sm:text-sm uppercase tracking-wider">Municipios</p>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 mx-auto mb-2 sm:mb-3" />
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900"><AnimatedCounter value="99.9" />%</div>
                            <p className="text-gray-500 text-[10px] sm:text-sm uppercase tracking-wider">Disponibilidad</p>
                        </FadeInSection>
                        <FadeInSection delay={0.3}>
                            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[#1E3A5F] mx-auto mb-2 sm:mb-3" />
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900"><AnimatedCounter value="30" />%</div>
                            <p className="text-gray-500 text-[10px] sm:text-sm uppercase tracking-wider">Más Rápido*</p>
                        </FadeInSection>
                        <FadeInSection delay={0.4}>
                            <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700 mx-auto mb-2 sm:mb-3" />
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900">100%</div>
                            <p className="text-gray-500 text-[10px] sm:text-sm uppercase tracking-wider">Seguro</p>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 1: PANEL DE CONTROL --- */}
            <section id="capacidades" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection>
                            <div className="bg-[#1E3A5F]/10 p-3 rounded-lg inline-block mb-4 sm:mb-6">
                                <LayoutDashboard size={20} className="sm:w-6 sm:h-6 text-[#1E3A5F]" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
                                Centro de Mando Unificado.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                Consolide la información de todas sus operaciones en una única vista táctica. 
                                Monitoree incidentes, gestione recursos y coordine equipos en tiempo real.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Vista de KPIs:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Personal, unidades y alertas en un solo vistazo.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Seguimiento de Incidentes:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Desde que se reportan hasta su cierre.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Disponibilidad en Vivo:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Sepa qué recursos están listos para actuar.</span>
                                    </div>
                                </li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-2 sm:p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1 sm:gap-1.5">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-400 flex-1 text-center">Panel de Control - Protección Civil</span>
                                </div>
                                <img src={dashboardPreview} alt="Dashboard Security App" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 2: MAPA DE ALERTAS --- */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection delay={0.2} className="order-2 md:order-1">
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-red-900 to-amber-900 rounded-2xl blur-xl opacity-20 group-hover:opacity-40"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-2 sm:p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1 sm:gap-1.5">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-400 flex-1 text-center">Mapa de Incidentes - Vista en Tiempo Real</span>
                                </div>
                                <img src={mapLocation} alt="Mapa de alertas" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                        <FadeInSection className="order-1 md:order-2">
                            <div className="bg-red-100 p-3 rounded-lg inline-block mb-4 sm:mb-6">
                                <MapPin size={20} className="sm:w-6 sm:h-6 text-red-800" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                Geolocalización de Precisión.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                                Cada alerta se geolocaliza al instante, permitiendo identificar el incidente y desplegar la unidad más cercana.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Visualización en Tiempo Real:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Incidentes reportados por ciudadanos y unidades.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Categorización por Tipo:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Pánico y Médica.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Optimización de Rutas:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Reduzca los tiempos de llegada.</span>
                                    </div>
                                </li>
                            </ul>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 3: APP CIUDADANO --- */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection>
                            <div className="bg-emerald-100 p-3 rounded-lg inline-block mb-4 sm:mb-6">
                                <Smartphone size={20} className="sm:w-6 sm:h-6 text-emerald-800" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                El Poder de la Ciudadanía.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                                Convierta a cada ciudadano en un aliado. Los reportes fluyen directamente a su panel con ubicación y tipo de incidente.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Reporte Simplificado:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> El ciudadano reporta en segundos.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Geolocalización Automática:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Ubicación precisa sin intervención.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Seguimiento de Estatus:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> El ciudadano sabe que es atendido.</span>
                                    </div>
                                </li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.05, rotate: -1 }} className="relative group flex justify-center">
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-900 to-green-900 rounded-3xl blur-xl opacity-20 group-hover:opacity-40"></div>
                                <div className="relative rounded-3xl shadow-2xl border border-gray-200 overflow-hidden bg-black">
                                    <img src={appCiudadano} alt="App Ciudadano Security App" className="relative w-full h-auto max-w-[260px] sm:max-w-xs" />
                                </div>
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- CALCULADORA DE PLAN --- */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#1E3A5F]/5 to-[#0F2440]/5">
                <div className="container mx-auto max-w-4xl">
                    <FadeInSection>
                        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#1E3A5F]/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-[#1E3A5F] p-3 rounded-xl">
                                    <Calculator size={20} className="sm:w-6 sm:h-6 text-white" />
                                </div>
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                    Descubre el plan ideal para tu municipio
                                </h2>
                            </div>
                            <p className="text-gray-600 text-sm sm:text-base mb-6">
                                Ingresa la población y te recomendaremos el plan que mejor se adapta a tus necesidades operativas.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Users size={16} className="sm:w-[18px] sm:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={poblacionConsulta}
                                            onChange={(e) => setPoblacionConsulta(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && calcularPlanRecomendado()}
                                            placeholder="Ej: 15000"
                                            min="1"
                                            className="w-full pl-9 sm:pl-10 pr-4 py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1E3A5F] focus:border-[#1E3A5F]"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Número de habitantes</p>
                                </div>
                                <button
                                    onClick={calcularPlanRecomendado}
                                    className="bg-[#1E3A5F] text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-[#2A4E7A] transition-all shadow-md inline-flex items-center justify-center gap-2"
                                >
                                    <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    Calcular plan
                                </button>
                            </div>

                            {planRecomendado && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                                            <Award size={20} className="sm:w-6 sm:h-6 text-green-700" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base sm:text-lg font-semibold text-green-800 flex items-center gap-2">
                                                <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                Tu plan recomendado: {planRecomendado.nombre}
                                            </p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                                                ${planRecomendado.precio_mensual?.toLocaleString()} MXN
                                                <span className="text-base sm:text-lg font-normal text-gray-500"> /mes</span>
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                <MapPin size={12} className="sm:w-3.5 sm:h-3.5" />
                                                Para municipios de {planRecomendado.poblacion_min?.toLocaleString()}
                                                a {planRecomendado.poblacion_max === 999999999 ? 'más de 50,000' : planRecomendado.poblacion_max?.toLocaleString()} habitantes
                                            </p>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                                                <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                                                    <Shield size={14} className="sm:w-4 sm:h-4 text-[#1E3A5F] mx-auto mb-1" />
                                                    <p className="text-[10px] sm:text-xs text-gray-500">Administradores</p>
                                                    <p className="font-bold text-gray-800 text-sm">{planRecomendado.max_admin || '∞'}</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                                                    <Users size={14} className="sm:w-4 sm:h-4 text-green-600 mx-auto mb-1" />
                                                    <p className="text-[10px] sm:text-xs text-gray-500">Policías/Paramédicos</p>
                                                    <p className="font-bold text-green-600 text-sm">ILIMITADOS</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                                                    <Truck size={14} className="sm:w-4 sm:h-4 text-green-600 mx-auto mb-1" />
                                                    <p className="text-[10px] sm:text-xs text-gray-500">Unidades</p>
                                                    <p className="font-bold text-green-600 text-sm">ILIMITADAS</p>
                                                </div>
                                                <div className="bg-white rounded-lg p-2 sm:p-3 text-center shadow-sm">
                                                    <Zap size={14} className="sm:w-4 sm:h-4 text-green-600 mx-auto mb-1" />
                                                    <p className="text-[10px] sm:text-xs text-gray-500">Prueba gratuita</p>
                                                    <p className="font-bold text-green-600 text-sm">{planRecomendado.trial_dias} días</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleSelectPlan(planRecomendado)}
                                                className="mt-4 sm:mt-6 bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-green-700 transition-all inline-flex items-center gap-2 shadow-md"
                                            >
                                                <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                Seleccionar {planRecomendado.nombre}
                                                <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- PLANES (Sección mejorada visualmente) --- */}
            <section id="planes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-7xl">
                    <FadeInSection>
                        <div className="text-center mb-12 sm:mb-16">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                                Capacidades que se adaptan a su operación.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                                Seleccione el nivel de capacidad y solicite una demostración de valor personalizada.
                            </p>
                        </div>
                    </FadeInSection>
                    {loadingPlanes ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 size={32} className="sm:w-10 sm:h-10 animate-spin text-[#1E3A5F]" />
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                            {planes.map((plan, index) => {
                                const colors = getPlanColors(index);
                                const esPopular = index === 1;
                                return (
                                    <FadeInSection key={plan.id} delay={index * 0.1}>
                                        <motion.div 
                                            whileHover={{ y: -8 }} 
                                            className={`relative bg-white rounded-xl shadow-xl overflow-hidden h-full flex flex-col border ${
                                                esPopular ? 'border-[#1E3A5F] ring-2 ring-[#1E3A5F]/20' : 'border-gray-200'
                                            }`}
                                        >
                                            {esPopular && (
                                                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white text-xs px-3 py-1 rounded-full font-medium z-10 shadow-lg">
                                                      Más Popular
                                                </div>
                                            )}
                                            <div className={`bg-gradient-to-r ${colors.gradient} p-6 sm:p-8 text-white`}>
                                                <h3 className="text-xl sm:text-2xl font-bold">{plan.nombre}</h3>
                                                <div className="mt-4">
                                                    <span className="text-3xl sm:text-4xl font-bold">
                                                        {plan.precio_mensual ? `$${plan.precio_mensual?.toLocaleString()}` : 'Personalizado'}
                                                    </span>
                                                    {plan.precio_mensual && <span className="text-sm opacity-80">/mes</span>}
                                                </div>
                                                <p className="text-sm opacity-80 mt-1">+ IVA</p>
                                                <p className="text-xs bg-white/20 rounded px-2 py-1 mt-3 inline-block">
                                                    {plan.poblacion_min === 0 ? 'Hasta' : 'Desde'} {
                                                        plan.poblacion_max === 999999999 ? 'más de 50,000' : `${plan.poblacion_max?.toLocaleString()}`
                                                    } hab.
                                                </p>
                                            </div>
                                            <div className="p-6 sm:p-8 flex-1 flex flex-col">
                                                <div className="bg-gray-50 p-4 sm:p-5 rounded-lg mb-6 border border-gray-200">
                                                    <h4 className="font-semibold text-gray-700 mb-3 text-xs sm:text-sm uppercase flex items-center gap-2">
                                                        <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-700" />
                                                        Capacidades del plan
                                                    </h4>
                                                    <ul className="space-y-2 sm:space-y-3">
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Administradores:</span>
                                                            <span className="font-semibold">{plan.max_admin || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Operadores Técnicos:</span>
                                                            <span className="font-semibold">{plan.max_tecnico || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Operadores Médicos:</span>
                                                            <span className="font-semibold">{plan.max_medico || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Operadores Policiales:</span>
                                                            <span className="font-semibold">{plan.max_policial || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Operadores Generales:</span>
                                                            <span className="font-semibold">{plan.max_general || 'Ilimitado'}</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Prueba gratuita:</span>
                                                            <span className="font-semibold text-emerald-700">{plan.trial_dias || 30} días</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm pt-2 border-t border-gray-200">
                                                            <span>Policías / Paramédicos:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADOS</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Unidades:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADAS</span>
                                                        </li>
                                                        <li className="flex justify-between text-xs sm:text-sm">
                                                            <span>Alertas:</span>
                                                            <span className="font-semibold text-green-600">ILIMITADAS</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <button 
                                                    onClick={() => handleSelectPlan(plan)} 
                                                    className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 mt-auto transition-all shadow-md ${
                                                        esPopular 
                                                            ? 'bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white hover:shadow-lg' 
                                                            : colors.button
                                                    } group`}
                                                >
                                                    Solicitar Demostración 
                                                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform" />
                                                </button>
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
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection>
                            <div className="bg-amber-100 p-3 rounded-lg inline-block mb-4 sm:mb-6">
                                <Users size={20} className="sm:w-6 sm:h-6 text-amber-800" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                Gestión de Capital Humano.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                                Registro y control de todo su personal operativo: policías, paramédicos y administradores. 
                                Gestione turnos, disponibilidad y asignaciones.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Directorio Completo:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Información de contacto y roles.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Disponibilidad en Tiempo Real:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Sepa quién está listo.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Asignación Dinámica:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Optimice la composición de equipos.</span>
                                    </div>
                                </li>
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-amber-900 to-orange-900 rounded-2xl blur-xl opacity-20"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-2 sm:p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1 sm:gap-1.5">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-400 flex-1 text-center">Gestión de Personal Operativo</span>
                                </div>
                                <img src={personalInscrito} alt="Gestión de personal" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 5: REPORTES --- */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-100">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection delay={0.2} className="order-2 md:order-1">
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#1E3A5F] to-cyan-900 rounded-2xl blur-xl opacity-20"></div>
                                <div className="relative bg-[#1A1A1A] rounded-t-xl p-2 sm:p-3 flex items-center gap-2 border-b border-gray-700">
                                    <div className="flex gap-1 sm:gap-1.5">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-gray-400 flex-1 text-center">Generación de Reportes</span>
                                </div>
                                <img src={reportesSistema} alt="Reportes del sistema" className="relative w-full h-auto" />
                            </motion.div>
                        </FadeInSection>
                        <FadeInSection className="order-1 md:order-2">
                            <div className="bg-cyan-100 p-3 rounded-lg inline-block mb-4 sm:mb-6">
                                <FileText size={20} className="sm:w-6 sm:h-6 text-cyan-800" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                Decisiones Basadas en Evidencia.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                                Genere reportes detallados sobre desempeño del personal, utilización de unidades e histórico de alertas.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Efectividad de Respuesta:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Mida tiempos y resolución.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Incidentes por Zona:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Identifique patrones y áreas de riesgo.</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3 sm:gap-4">
                                    <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                                        <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-700" />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm sm:text-base">Exportación a PDF/Excel:</span>
                                        <span className="text-gray-600 text-sm sm:text-base"> Comparta información fácilmente.</span>
                                    </div>
                                </li>
                            </ul>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL - IMPACTO MÁXIMO --- */}
            <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#0F0F0F]">
                <div className="container mx-auto max-w-4xl text-center">
                    <FadeInSection>
                        <div className="inline-flex items-center gap-2 bg-[#1E3A5F]/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-[#1E3A5F]/50">
                            <Sparkles size={14} className="text-yellow-400" />
                            PRUEBA GRATUITA SIN COMPROMISO
                        </div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                            ¿Listo para modernizar la seguridad de tu municipio?
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
                            Cientos de municipios ya confían en Security App. 
                            <span className="text-white font-semibold block sm:inline"> Únete hoy y marca la diferencia.</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="#planes" 
                                className="group px-8 py-4 bg-gradient-to-r from-[#1E3A5F] to-[#0F2440] text-white rounded-xl font-bold text-base hover:shadow-2xl hover:shadow-[#1E3A5F]/50 transition-all inline-flex items-center justify-center gap-2 border border-white/10"
                            >
                                Comenzar prueba gratuita
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a 
                                href="mailto:softnovaintegradora@gmail.com" 
                                className="px-8 py-4 bg-transparent text-white border border-gray-600 rounded-xl font-medium text-base hover:bg-white/5 transition-all"
                            >
                                Hablar con ventas
                            </a>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-6">
                            Sin tarjeta de crédito • Configuración en 5 minutos • Soporte 24/7
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-black text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-4">
                            <Hexagon size={20} className="sm:w-6 sm:h-6 text-[#1E3A5F]" fill="currentColor" />
                            <span className="font-bold text-lg sm:text-xl tracking-tight">SOFTNOVA</span>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm mb-2">
                            Security App es un producto de SoftNova
                        </p>
                        <p className="text-gray-500 text-xs">
                            Tecnología para la Protección Civil. © 2026 SoftNova. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;