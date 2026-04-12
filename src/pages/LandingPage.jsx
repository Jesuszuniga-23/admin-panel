import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import {
    Shield, Building2, Users, Truck, Bell, CheckCircle, ArrowRight,
    Zap, Lock, Activity, ChevronRight, Loader2,
    MapPin, FileText, Smartphone, LayoutDashboard, TrendingUp,
    Hexagon, BadgeCheck, Siren, Calculator, Target, Award,
    Clock, AlertTriangle, Radio, Eye, Globe, Sparkles,
    Radar, Cpu, Network, Database, Wifi, Bluetooth, Server
} from 'lucide-react';

import RegisterForm from '../components/landing/RegisterForm';
import registroService from '../services/public/registro.service';
import toast from 'react-hot-toast';

// Importación directa de imágenes
import heroBg from '../assets/images/landing/hero-bg.jpeg';
import dashboardPreview from '../assets/images/landing/dashboard-preview.png';
import mapLocation from '../assets/images/landing/mapLocation.png';
import personalInscrito from '../assets/images/landing/personalInscrito.png';
import reportesSistema from '../assets/images/landing/ReportesSistema.png';
import appCiudadano from '../assets/images/landing/appCiudadano.jpeg';

// --- Componente de Partículas Tecnológicas (EFECTO WOW) ---
const TechParticles = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-0.5 h-0.5 bg-cyan-400 rounded-full"
                    initial={{ 
                        x: Math.random() * window.innerWidth, 
                        y: Math.random() * window.innerHeight,
                        opacity: 0 
                    }}
                    animate={{ 
                        y: [null, -100],
                        opacity: [0, 0.8, 0]
                    }}
                    transition={{ 
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}
        </div>
    );
};

// --- Componente de Grid Tecnológico Animado ---
const TechGrid = () => {
    return (
        <motion.div 
            className="absolute inset-0 opacity-[0.03]"
            animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
            }}
            style={{
                backgroundImage: `linear-gradient(to right, #1E3A5F 1px, transparent 1px),
                                  linear-gradient(to bottom, #1E3A5F 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }}
        />
    );
};

// --- Componente de Glitch Effect para Títulos ---
const GlitchText = ({ children, className }) => {
    return (
        <motion.span 
            className={`relative inline-block ${className}`}
            whileHover="glitch"
        >
            <motion.span
                variants={{
                    glitch: {
                        x: [0, -2, 3, -1, 0],
                        textShadow: [
                            '0 0 0 #fff',
                            '2px 0 0 #1E3A5F, -2px 0 0 #00ffff',
                            '-2px 0 0 #1E3A5F, 2px 0 0 #00ffff',
                            '0 0 0 #fff'
                        ],
                        transition: { duration: 0.3 }
                    }
                }}
            >
                {children}
            </motion.span>
        </motion.span>
    );
};

// --- Componente de Tarjeta con Efecto 3D ---
const Card3D = ({ children, className }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);
    const springConfig = { damping: 20, stiffness: 300 };
    const springRotateX = useSpring(rotateX, springConfig);
    const springRotateY = useSpring(rotateY, springConfig);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className={`relative ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
                rotateX: springRotateX, 
                rotateY: springRotateY,
                transformStyle: "preserve-3d",
                perspective: 1000
            }}
            whileHover={{ scale: 1.02 }}
        >
            {children}
        </motion.div>
    );
};

// --- Componente de Animación FadeIn mejorado ---
const FadeInSection = ({ children, delay = 0, direction = 'up' }) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.2 });

    useEffect(() => {
        if (inView) controls.start('visible');
    }, [controls, inView]);

    const variants = {
        hidden: { opacity: 0, y: direction === 'up' ? 50 : -50, scale: 0.9 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
                duration: 0.8,
                delay,
                ease: [0.25, 0.1, 0.25, 1]
            }
        }
    };

    return (
        <motion.div
            ref={ref}
            animate={controls}
            initial="hidden"
            variants={variants}
        >
            {children}
        </motion.div>
    );
};

// --- Componente de Conteo Animado con Efecto Glow ---
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

    return (
        <motion.span 
            ref={ref}
            className="relative"
            animate={{ 
                textShadow: inView ? [
                    '0 0 0px #1E3A5F',
                    '0 0 20px #1E3A5F',
                    '0 0 0px #1E3A5F'
                ] : 'none'
            }}
            transition={{ duration: 2, repeat: 1 }}
        >
            {count}{suffix}
        </motion.span>
    );
};

// --- Paleta de colores para planes ---
const getPlanColors = (index) => {
    const colorSchemes = [
        { gradient: 'from-slate-800 to-slate-900', bgLight: 'bg-gray-100', border: 'border-gray-300', button: 'bg-white text-gray-800 border border-gray-400 hover:bg-gray-100', accent: 'text-gray-600', glow: 'shadow-gray-500/20' },
        { gradient: 'from-cyan-600 to-blue-800', bgLight: 'bg-blue-50/30', border: 'border-cyan-300', button: 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-700 hover:to-blue-800', accent: 'text-cyan-600', glow: 'shadow-cyan-500/30' },
        { gradient: 'from-violet-700 to-purple-900', bgLight: 'bg-purple-50', border: 'border-purple-300', button: 'bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800', accent: 'text-violet-600', glow: 'shadow-purple-500/30' }
    ];
    return colorSchemes[index % colorSchemes.length];
};

const LandingPage = () => {
    const [planes, setPlanes] = useState([]);
    const [loadingPlanes, setLoadingPlanes] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [poblacionConsulta, setPoblacionConsulta] = useState('');
    const [planRecomendado, setPlanRecomendado] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { scrollY, scrollYProgress } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
    const scaleProgress = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    // Efecto de mouse parallax
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
        <motion.div 
            className="min-h-screen bg-black font-sans antialiased selection:bg-cyan-500 selection:text-black"
            style={{ scale: scaleProgress }}
        >
            {/* --- HEADER CON EFECTO GLASS Y GLOW --- */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl z-50 border-b border-cyan-500/20"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center relative">
                    <motion.div 
                        className="flex items-center gap-2 sm:gap-3"
                        whileHover={{ scale: 1.02 }}
                    >
                        <motion.div 
                            className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/30"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <Hexagon className="h-5 w-5 text-white" fill="currentColor" />
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                                SECURITY<span className="text-cyan-400">APP</span>
                            </span>
                            <span className="text-[8px] sm:text-[10px] text-gray-400 -mt-0.5">by SoftNova</span>
                        </div>
                    </motion.div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <a href="/login" className="text-gray-300 hover:text-cyan-400 font-medium transition-colors text-xs sm:text-sm">Acceso</a>
                        <motion.a 
                            href="#planes" 
                            className="px-4 sm:px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Demo
                        </motion.a>
                    </div>
                </div>
            </motion.header>

            {/* --- HERO - EFECTOS WOW --- */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                <TechParticles />
                <TechGrid />
                
                <motion.div
                    style={{ 
                        y: heroY, 
                        opacity: heroOpacity,
                        backgroundImage: `url(${heroBg})`,
                        x: mousePosition.x,
                        y: mousePosition.y
                    }}
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
                />
                
                {/* Overlay con gradiente dinámico */}
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent"
                    animate={{
                        background: [
                            'linear-gradient(to right, #000000 0%, #000000cc 50%, transparent 100%)',
                            'linear-gradient(to right, #000000 0%, #000000dd 60%, transparent 100%)',
                            'linear-gradient(to right, #000000 0%, #000000cc 50%, transparent 100%)'
                        ]
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                
                {/* Línea de escaneo horizontal (efecto radar) */}
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-20"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-0">
                    <FadeInSection>
                        {/* Badge con efecto pulso */}
                        <motion.div 
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600/30 to-orange-600/30 backdrop-blur-xl text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium mb-6 sm:mb-8 border border-red-500/50"
                            animate={{ 
                                boxShadow: [
                                    '0 0 0px #ef4444',
                                    '0 0 20px #ef4444',
                                    '0 0 0px #ef4444'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5 text-red-400 animate-pulse" /> 
                            <span className="tracking-wider">CADA SEGUNDO CUENTA • RESPUESTA INMEDIATA</span>
                            <Radar size={12} className="text-red-400 animate-spin" />
                        </motion.div>
                        
                        {/* Título con efecto Glitch */}
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-[1.1] sm:leading-tight tracking-tight max-w-5xl">
                            <GlitchText className="block">Plataforma de Comando</GlitchText>
                            <GlitchText className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                                y Control Unificado
                            </GlitchText>
                        </h1>
                        
                        {/* Subtítulo con typing effect */}
                        <motion.p 
                            className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl leading-relaxed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span className="text-cyan-400 font-semibold">Geolocalización en vivo</span>
                            <span className="text-gray-400"> • </span>
                            <span className="text-blue-400 font-semibold">Asignación automática</span>
                            <span className="text-gray-400"> • </span>
                            <span className="text-purple-400 font-semibold">Analítica predictiva</span>
                            <br />
                            <span className="text-gray-300">
                                Centraliza emergencias, coordina unidades y reduce hasta un 
                                <motion.span 
                                    className="text-cyan-300 font-bold ml-1"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    30% el tiempo de respuesta
                                </motion.span>.
                            </span>
                        </motion.p>

                        {/* Beneficios con íconos tech */}
                        <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 sm:mb-10">
                            {[
                                { icon: Cpu, text: 'Edge Computing' },
                                { icon: Network, text: 'Mesh Network' },
                                { icon: Database, text: 'Real-time DB' },
                                { icon: Server, text: '99.99% Uptime' }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.8 + i * 0.1 }}
                                >
                                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <item.icon size={12} className="text-cyan-400" />
                                    </div>
                                    <span className="text-gray-300 text-xs sm:text-sm">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* CTAs con efectos */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <motion.a 
                                href="#capacidades" 
                                className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-semibold text-sm sm:text-base overflow-hidden"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Ver plataforma en acción
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </motion.a>
                            <motion.a 
                                href="#planes" 
                                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent text-white border border-cyan-500/50 rounded-xl font-medium text-sm sm:text-base backdrop-blur-sm relative overflow-hidden group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                <span className="relative z-10">Ver planes y precios</span>
                            </motion.a>
                        </div>
                    </FadeInSection>
                </div>

                {/* Scroll Indicator mejorado */}
                <motion.div 
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
                    animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="w-6 h-10 border-2 border-cyan-500/50 rounded-full flex justify-center backdrop-blur-sm">
                        <motion.div 
                            className="w-1 h-2 bg-cyan-400 rounded-full mt-2"
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* --- SECCIÓN: TECNOLOGÍA QUE SALVA VIDAS --- */}
            <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
                <TechGrid />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <FadeInSection>
                        <div className="text-center mb-12">
                            <motion.div
                                className="inline-flex items-center gap-2 bg-cyan-500/10 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-500/30 mb-4"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Cpu size={16} className="text-cyan-400" />
                                <span className="text-cyan-300 text-xs sm:text-sm font-medium">TECNOLOGÍA DE PUNTA</span>
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                                Infraestructura <span className="text-cyan-400">Enterprise</span> al alcance de tu municipio
                            </h2>
                            <p className="text-gray-400 text-base sm:text-lg max-w-3xl mx-auto">
                                La misma tecnología que usan las grandes metrópolis, optimizada para tu operación.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { icon: Cpu, title: 'Edge AI', desc: 'Procesamiento en tiempo real en el edge' },
                            { icon: Network, title: 'Mesh Network', desc: 'Red resiliente sin punto único de fallo' },
                            { icon: Database, title: 'Tiempo Real', desc: 'Sincronización sub-segundo' },
                            { icon: Shield, title: 'Grado Militar', desc: 'Cifrado AES-256 end-to-end' }
                        ].map((item, i) => (
                            <FadeInSection key={i} delay={i * 0.1}>
                                <Card3D className="h-full">
                                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 h-full">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-cyan-500/30">
                                            <item.icon size={24} className="text-cyan-400" />
                                        </div>
                                        <h3 className="font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                </Card3D>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- MÉTRICAS CON EFECTO GLOW --- */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black border-y border-cyan-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                        {[
                            { icon: Building2, value: '50', suffix: '+', label: 'Municipios', color: 'cyan' },
                            { icon: Activity, value: '99.9', suffix: '%', label: 'Disponibilidad', color: 'emerald' },
                            { icon: TrendingUp, value: '30', suffix: '%', label: 'Más Rápido', color: 'cyan' },
                            { icon: Lock, value: '100', suffix: '%', label: 'Seguro', color: 'purple' }
                        ].map((item, i) => (
                            <FadeInSection key={i} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <item.icon className={`h-6 w-6 sm:h-8 sm:w-8 text-${item.color}-500 mx-auto mb-2 sm:mb-3`} />
                                    <div className="text-2xl sm:text-3xl font-bold text-white">
                                        <AnimatedCounter value={item.value} suffix={item.suffix} />
                                    </div>
                                    <p className="text-gray-400 text-[10px] sm:text-sm uppercase tracking-wider">{item.label}</p>
                                </motion.div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- RESTO DE SECCIONES CON EFECTOS SIMILARES --- */}
            {/* Panel de Control con efecto 3D */}
            <section id="capacidades" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
                <TechGrid />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
                        <FadeInSection>
                            <motion.div 
                                className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-3 rounded-lg inline-block mb-4 sm:mb-6 border border-cyan-500/30"
                                whileHover={{ scale: 1.05 }}
                            >
                                <LayoutDashboard size={20} className="sm:w-6 sm:h-6 text-cyan-400" />
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
                                Centro de Mando <span className="text-cyan-400">Unificado.</span>
                            </h2>
                            <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 leading-relaxed">
                                Consolide la información de todas sus operaciones en una única vista táctica. 
                                Monitoree incidentes, gestione recursos y coordine equipos en tiempo real.
                            </p>
                            <ul className="space-y-3 sm:space-y-4">
                                {[
                                    'Vista de KPIs en tiempo real',
                                    'Seguimiento de incidentes end-to-end',
                                    'Disponibilidad de recursos en vivo'
                                ].map((text, i) => (
                                    <motion.li 
                                        key={i}
                                        className="flex items-start gap-3 sm:gap-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 p-1.5 sm:p-2 rounded-full flex-shrink-0 border border-emerald-500/30">
                                            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-emerald-400" />
                                        </div>
                                        <div>
                                            <span className="text-gray-300 text-sm sm:text-base">{text}</span>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <Card3D>
                                <motion.div 
                                    className="relative group rounded-2xl shadow-2xl border border-gray-700 overflow-hidden"
                                    whileHover={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' }}
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-800 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-700"></div>
                                    <div className="relative bg-[#0A0A0A] rounded-t-xl p-2 sm:p-3 flex items-center gap-2 border-b border-gray-700">
                                        <div className="flex gap-1 sm:gap-1.5">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                                        </div>
                                        <span className="text-[10px] sm:text-xs text-gray-400 flex-1 text-center">Panel de Control - Protección Civil</span>
                                    </div>
                                    <img src={dashboardPreview} alt="Dashboard Security App" className="relative w-full h-auto" />
                                </motion.div>
                            </Card3D>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- PLANES CON EFECTO 3D Y GLOW --- */}
            <section id="planes" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
                <TechGrid />
                <div className="container mx-auto max-w-7xl relative z-10">
                    <FadeInSection>
                        <div className="text-center mb-12 sm:mb-16">
                            <motion.div
                                className="inline-flex items-center gap-2 bg-purple-500/10 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-500/30 mb-4"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Sparkles size={16} className="text-purple-400" />
                                <span className="text-purple-300 text-xs sm:text-sm font-medium">PLANES ESCALABLES</span>
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                                Capacidades que se adaptan a su operación.
                            </h2>
                            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                                Seleccione el nivel de capacidad y solicite una demostración de valor personalizada.
                            </p>
                        </div>
                    </FadeInSection>
                    {loadingPlanes ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 size={32} className="sm:w-10 sm:h-10 animate-spin text-cyan-400" />
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                            {planes.map((plan, index) => {
                                const colors = getPlanColors(index);
                                const esPopular = index === 1;
                                return (
                                    <FadeInSection key={plan.id} delay={index * 0.1}>
                                        <Card3D>
                                            <motion.div 
                                                className={`relative bg-gradient-to-b from-gray-900 to-black rounded-xl shadow-2xl overflow-hidden h-full flex flex-col border ${
                                                    esPopular ? 'border-cyan-500 shadow-cyan-500/20' : 'border-gray-700'
                                                }`}
                                                whileHover={{ 
                                                    boxShadow: esPopular ? '0 0 40px rgba(6, 182, 212, 0.3)' : '0 0 20px rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                {esPopular && (
                                                    <motion.div 
                                                        className="absolute top-4 right-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white text-xs px-3 py-1 rounded-full font-medium z-10 shadow-lg"
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                         Más Popular
                                                    </motion.div>
                                                )}
                                                <div className={`bg-gradient-to-r ${colors.gradient} p-6 sm:p-8 text-white relative overflow-hidden`}>
                                                    <motion.div 
                                                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                                                        animate={{ x: ['-100%', '100%'] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                    />
                                                    <h3 className="text-xl sm:text-2xl font-bold relative z-10">{plan.nombre}</h3>
                                                    <div className="mt-4 relative z-10">
                                                        <span className="text-3xl sm:text-4xl font-bold">
                                                            {plan.precio_mensual ? `$${plan.precio_mensual?.toLocaleString()}` : 'Personalizado'}
                                                        </span>
                                                        {plan.precio_mensual && <span className="text-sm opacity-80">/mes</span>}
                                                    </div>
                                                    <p className="text-sm opacity-80 mt-1 relative z-10">+ IVA</p>
                                                    <p className="text-xs bg-white/20 rounded px-2 py-1 mt-3 inline-block relative z-10">
                                                        {plan.poblacion_min === 0 ? 'Hasta' : 'Desde'} {
                                                            plan.poblacion_max === 999999999 ? 'más de 50,000' : `${plan.poblacion_max?.toLocaleString()}`
                                                        } hab.
                                                    </p>
                                                </div>
                                                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                                                    <div className="bg-gray-800/50 p-4 sm:p-5 rounded-lg mb-6 border border-gray-700">
                                                        <h4 className="font-semibold text-gray-300 mb-3 text-xs sm:text-sm uppercase flex items-center gap-2">
                                                            <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-400" />
                                                            Capacidades del plan
                                                        </h4>
                                                        <ul className="space-y-2 sm:space-y-3">
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Administradores:</span>
                                                                <span className="font-semibold text-white">{plan.max_admin || 'Ilimitado'}</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Operadores Técnicos:</span>
                                                                <span className="font-semibold text-white">{plan.max_tecnico || 'Ilimitado'}</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Operadores Médicos:</span>
                                                                <span className="font-semibold text-white">{plan.max_medico || 'Ilimitado'}</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Operadores Policiales:</span>
                                                                <span className="font-semibold text-white">{plan.max_policial || 'Ilimitado'}</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Operadores Generales:</span>
                                                                <span className="font-semibold text-white">{plan.max_general || 'Ilimitado'}</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Prueba gratuita:</span>
                                                                <span className="font-semibold text-emerald-400">{plan.trial_dias || 30} días</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm pt-2 border-t border-gray-700">
                                                                <span className="text-gray-400">Policías / Paramédicos:</span>
                                                                <span className="font-semibold text-cyan-400">ILIMITADOS</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Unidades:</span>
                                                                <span className="font-semibold text-cyan-400">ILIMITADAS</span>
                                                            </li>
                                                            <li className="flex justify-between text-xs sm:text-sm">
                                                                <span className="text-gray-400">Alertas:</span>
                                                                <span className="font-semibold text-cyan-400">ILIMITADAS</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <motion.button 
                                                        onClick={() => handleSelectPlan(plan)} 
                                                        className={`w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 mt-auto transition-all relative overflow-hidden ${
                                                            esPopular 
                                                                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/30' 
                                                                : 'bg-gray-800 text-white border border-gray-600 hover:bg-gray-700'
                                                        } group`}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <motion.div 
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                        />
                                                        <span className="relative z-10">Solicitar Demostración</span>
                                                        <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 transition-transform relative z-10" />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        </Card3D>
                                    </FadeInSection>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* --- CTA FINAL CON EFECTO GLOW MÁXIMO --- */}
            <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-black relative overflow-hidden">
                <TechParticles />
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10"
                    animate={{ 
                        background: [
                            'linear-gradient(to right, #06b6d41a 0%, #8b5cf61a 50%, #3b82f61a 100%)',
                            'linear-gradient(to right, #3b82f61a 0%, #06b6d41a 50%, #8b5cf61a 100%)',
                            'linear-gradient(to right, #06b6d41a 0%, #8b5cf61a 50%, #3b82f61a 100%)'
                        ]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <FadeInSection>
                        <motion.div 
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-xl text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-cyan-500/50"
                            animate={{ 
                                boxShadow: [
                                    '0 0 0px #06b6d4',
                                    '0 0 30px #06b6d4',
                                    '0 0 0px #06b6d4'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles size={14} className="text-cyan-400" />
                            PRUEBA GRATUITA SIN COMPROMISO
                        </motion.div>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                            ¿Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">revolucionar</span> la seguridad de tu municipio?
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
                            Únete a los municipios que ya confían en Security App.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.a 
                                href="#planes" 
                                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl font-bold text-base overflow-hidden"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div 
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Comenzar prueba gratuita
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </motion.a>
                            <motion.a 
                                href="mailto:softnovaintegradora@gmail.com" 
                                className="px-8 py-4 bg-transparent text-white border border-cyan-500/50 rounded-xl font-medium text-base backdrop-blur-sm relative overflow-hidden group"
                                whileHover={{ scale: 1.02 }}
                            >
                                <span className="relative z-10">Hablar con ventas</span>
                            </motion.a>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-6">
                            Sin tarjeta de crédito • Configuración en 5 minutos • Soporte 24/7
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-black text-white py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center">
                        <motion.div 
                            className="flex items-center gap-2 mb-4"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Hexagon size={20} className="sm:w-6 sm:h-6 text-cyan-400" fill="currentColor" />
                            <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">SOFTNOVA</span>
                        </motion.div>
                        <p className="text-gray-400 text-xs sm:text-sm mb-2">
                            Security App es un producto de SoftNova
                        </p>
                        <p className="text-gray-500 text-xs">
                            Tecnología para la Protección Civil. © 2026 SoftNova. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </motion.div>
    );
};

export default LandingPage;