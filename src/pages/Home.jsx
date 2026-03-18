// =====================================================
// src/pages/Home.tsx - VERSIÓN PREMIUM CON MEMBRESÍAS Y MANEJO DE ERRORES
// =====================================================
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  MapPin, 
  Clock, 
  ArrowRight, 
  LogIn,
  Star,
  Award,
  Zap,
  Heart,
  Phone,
  Mail,
  Map,
  ChevronRight,
  CheckCircle2,
  Building2,
  Ambulance,
  Flame,
  Radio,
  Satellite,
  Globe,
  ShieldCheck,
  Crown,
  Gem,
  Sparkles,
  X
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 👇 MANEJO DE ERRORES DESDE LA URL
  useEffect(() => {
    // Verificar si hay errores en la URL
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const message = params.get('message');
    
    if (error && message) {
      setShowError(true);
      setErrorMessage(decodeURIComponent(message));
      
      // Limpiar la URL después de 5 segundos
      setTimeout(() => {
        setShowError(false);
        window.history.replaceState({}, '', '/');
      }, 5000);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white">
      {/* ========== NAVBAR ========== */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg">
                <Shield className="text-white" size={28} />
              </div>
              <div>
                <span className="font-bold text-xl text-gray-800">Sistema de Emergencias</span>
                <p className="text-xs text-gray-500">Plataforma Nacional</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Inicio</a>
              <a href="#membresias" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Planes</a>
              <a href="#caracteristicas" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Características</a>
              <a href="#contacto" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">Contacto</a>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <LogIn size={18} />
              Acceso Administrativo
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* 👇 BANNER DE ERROR (cuando alguien no autorizado intenta acceder) */}
      {showError && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md animate-slideDown">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-xl p-4 mx-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Acceso Denegado</h3>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
              <button 
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== HERO SECTION ========== */}
      <section id="inicio" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        {/* Fondo animado */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-sm font-medium">Plataforma Certificada ISO 27001</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Gestión de <br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 text-transparent bg-clip-text">
                  Emergencias 360°
                </span>
              </h1>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                La plataforma más avanzada para la administración y coordinación de servicios de emergencia. 
                Tecnología de punta al servicio de la seguridad ciudadana.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 flex items-center gap-2"
                >
                  Comenzar Ahora
                  <ArrowRight size={20} />
                </button>
                <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm">
                  <PlayIcon size={20} />
                  Ver Demo
                </button>
              </div>

              {/* Stats flotantes */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold">500+</div>
                  <div className="text-sm text-blue-200">Emergencias diarias</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">50+</div>
                  <div className="text-sm text-blue-200">Municipios</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">99.9%</div>
                  <div className="text-sm text-blue-200">Tiempo activo</div>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-30"></div>
              <img 
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Emergency Control Center"
                className="relative rounded-2xl shadow-2xl border-4 border-white/10"
              />
              
              {/* Badge flotante */}
              <div className="absolute -bottom-6 -left-6 bg-white text-gray-800 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-slow">
                <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
                <span className="font-semibold">24/7 Monitoreo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECCIÓN DE MEMBRESÍAS ========== */}
      <section id="membresias" className="py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Planes y Membresías</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Elige el plan que se adapte a tus <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                necesidades operativas
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Membresías flexibles diseñadas para instituciones públicas y privadas. 
              Todos los planes incluyen actualizaciones y soporte 24/7.
            </p>
          </div>

          {/* Cards de membresías */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            
            {/* Card Básica */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <Building2 className="text-blue-600" size={28} />
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">Básico</span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Municipal</h3>
                <p className="text-gray-500 mb-6">Para gobiernos locales y pequeñas municipalidades</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-gray-900">$499</span>
                  <span className="text-gray-500">/mes</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <Feature text="Hasta 10 usuarios administrativos" />
                  <Feature text="Gestión de emergencias básica" />
                  <Feature text="Reportes mensuales" />
                  <Feature text="Soporte por correo 12/7" />
                  <Feature text="App móvil incluida" />
                </ul>

                <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                  Comenzar prueba gratis
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Card Profesional - DESTACADA */}
            <div className="group relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-6 overflow-hidden border-2 border-blue-400 scale-105 z-10">
              <div className="absolute top-8 right-8 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg transform rotate-3 animate-pulse">
                ⭐ MÁS POPULAR
              </div>
              
              <div className="absolute inset-0 bg-grid-pattern-white opacity-10"></div>
              
              <div className="p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <Crown className="text-yellow-300" size={32} />
                  </div>
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">Profesional</span>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Metropolitano</h3>
                <p className="text-blue-100 mb-6">Para ciudades medianas y grandes corporaciones</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$999</span>
                  <span className="text-blue-200">/mes</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <FeatureWhite text="Hasta 50 usuarios administrativos" />
                  <FeatureWhite text="Gestión avanzada con IA" />
                  <FeatureWhite text="Reportes en tiempo real" />
                  <FeatureWhite text="Soporte prioritario 24/7" />
                  <FeatureWhite text="API para integraciones" />
                  <FeatureWhite text="Dashboard personalizable" />
                </ul>

                <button className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                  Adquirir Ahora
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Card Enterprise */}
            <div className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 overflow-hidden border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-10"></div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-purple-100 p-3 rounded-2xl">
                    <Gem className="text-purple-600" size={28} />
                  </div>
                  <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">Enterprise</span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Nacional</h3>
                <p className="text-gray-500 mb-6">Para gobiernos estatales y grandes instituciones</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-gray-900">$2,499</span>
                  <span className="text-gray-500">/mes</span>
                </div>

                <ul className="space-y-4 mb-8">
                  <Feature text="Usuarios ilimitados" />
                  <Feature text="Centro de control dedicado" />
                  <Feature text="Analítica predictiva" />
                  <Feature text="SLA garantizado 99.99%" />
                  <Feature text="Integración con sistemas existentes" />
                  <Feature text="Backup en tiempo real" />
                  <Feature text="Consultoría personalizada" />
                </ul>

                <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                  Contactar ventas
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 mt-12 text-sm">
            *Todos los planes incluyen 14 días de prueba sin compromiso. Sin tarjeta de crédito requerida.
          </p>
        </div>
      </section>

      {/* ========== CARACTERÍSTICAS ========== */}
      <section id="caracteristicas" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Características <span className="text-blue-600">Avanzadas</span>
            </h2>
            <p className="text-xl text-gray-600">Tecnología de punta para la gestión de emergencias</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MapPin className="text-blue-600" size={32} />}
              title="Geolocalización en Tiempo Real"
              description="Seguimiento preciso de unidades con mapas interactivos y rutas optimizadas."
            />
            <FeatureCard
              icon={<Clock className="text-blue-600" size={32} />}
              title="Respuesta Inmediata"
              description="Tiempo de respuesta optimizado con asignación automática de unidades."
            />
            <FeatureCard
              icon={<Users className="text-blue-600" size={32} />}
              title="Gestión de Personal"
              description="Administración de roles, horarios y disponibilidad del personal."
            />
            <FeatureCard
              icon={<Radio className="text-blue-600" size={32} />}
              title="Comunicación Integrada"
              description="Sistema de comunicaciones unificado con radio y mensajería."
            />
            <FeatureCard
              icon={<Satellite className="text-blue-600" size={32} />}
              title="Cobertura Nacional"
              description="Red de cobertura en todo el territorio con respaldo satelital."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-blue-600" size={32} />}
              title="Seguridad de Datos"
              description="Encriptación de extremo a extremo y respaldo en la nube."
            />
          </div>
        </div>
      </section>

      {/* ========== CONTACTO ========== */}
      <section id="contacto" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                ¿Listo para <span className="text-blue-600">transformar</span> tu gestión de emergencias?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Contáctanos para una demostración personalizada y descubre cómo podemos ayudarte.
              </p>
              
              <div className="space-y-4">
                <ContactItem icon={<Phone />} text="+52 (800) 123-4567" />
                <ContactItem icon={<Mail />} text="ventas@emergencias.mx" />
                <ContactItem icon={<Map />} text="CDMX, México" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl">
              <form className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input 
                  type="email" 
                  placeholder="Correo electrónico"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <input 
                  type="tel" 
                  placeholder="Teléfono"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600">
                  <option>Selecciona un plan</option>
                  <option>Básico</option>
                  <option>Profesional</option>
                  <option>Enterprise</option>
                </select>
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all">
                  Solicitar información
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield size={32} className="text-blue-400" />
                <span className="font-bold text-xl">Sistema de Emergencias</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Plataforma segura para la gestión integral de emergencias a nivel nacional.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Producto</h4>
              <ul className="space-y-3">
                <FooterLink href="#caracteristicas">Características</FooterLink>
                <FooterLink href="#membresias">Planes</FooterLink>
                <FooterLink href="#">Seguridad</FooterLink>
                <FooterLink href="#">API</FooterLink>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Compañía</h4>
              <ul className="space-y-3">
                <FooterLink href="#">Acerca de</FooterLink>
                <FooterLink href="#">Blog</FooterLink>
                <FooterLink href="#">Prensa</FooterLink>
                <FooterLink href="#">Empleo</FooterLink>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-lg">Legal</h4>
              <ul className="space-y-3">
                <FooterLink href="#">Privacidad</FooterLink>
                <FooterLink href="#">Términos</FooterLink>
                <FooterLink href="#">Cookies</FooterLink>
                <FooterLink href="#">Avisos legales</FooterLink>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            © 2026 Sistema de Emergencias. Todos los derechos reservados. 
            <span className="block mt-2 text-xs">Hecho por Alumnos de UTTEHUACAN</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Componentes auxiliares
const FeatureCard = ({ icon, title, description }) => (
  <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
    <div className="bg-blue-50 group-hover:bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const Feature = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
    <span className="text-gray-600">{text}</span>
  </li>
);

const FeatureWhite = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
    <span className="text-white/90">{text}</span>
  </li>
);

const ContactItem = ({ icon, text }) => (
  <div className="flex items-center gap-4 text-gray-600">
    <div className="bg-blue-100 p-3 rounded-full">
      {icon}
    </div>
    <span className="text-lg">{text}</span>
  </div>
);

const FooterLink = ({ href, children }) => (
  <li>
    <a href={href} className="text-gray-400 hover:text-white transition-colors text-sm">
      {children}
    </a>
  </li>
);

// Icono de Play personalizado
const PlayIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
  </svg>
);

export default Home;