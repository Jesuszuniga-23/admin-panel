import { 
  Car, Ambulance, Shield, Crown, AlertTriangle, Heart, 
  MapPin, Clock, Truck, User, Users, Eye, Edit, Trash2,
  Power, X, Check, Plus, FileText, Activity, Bell,
  Filter, Calendar, Phone, Mail, MapPinned, ChevronLeft,
  ChevronRight, Search, Home, LogOut, Settings, Timer,
  CarFront, Gauge, TimerReset, CheckCircle, XCircle
} from 'lucide-react';

export const ENTIDADES = {
  // Unidades Operativas
  PATRULLA: {
    id: 'patrulla',
    icono: CarFront,
    color: 'blue',
    colorHex: '#3B82F6',
    bgGradient: 'from-blue-600 to-blue-700',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-600',
    label: 'Patrulla Policial'
  },
  AMBULANCIA: {
    id: 'ambulancia',
    icono: Ambulance,
    color: 'green',
    colorHex: '#10B981',
    bgGradient: 'from-green-600 to-emerald-700',
    bgLight: 'bg-green-100',
    textLight: 'text-green-600',
    label: 'Ambulancia'
  },
  
  // Roles de Personal
  ADMIN: {
    id: 'admin',
    icono: Shield,
    color: 'purple',
    colorHex: '#8B5CF6',
    bgGradient: 'from-purple-600 to-indigo-700',
    bgLight: 'bg-purple-100',
    textLight: 'text-purple-600',
    label: 'Administrador'
  },
  SUPERADMIN: {
    id: 'superadmin',
    icono: Crown,
    color: 'red',
    colorHex: '#EF4444',
    bgGradient: 'from-red-600 to-rose-700',
    bgLight: 'bg-red-100',
    textLight: 'text-red-600',
    label: 'Super Administrador'
  },
  POLICIA: {
    id: 'policia',
    icono: Shield,
    color: 'blue',
    colorHex: '#3B82F6',
    bgGradient: 'from-blue-600 to-blue-700',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-600',
    label: 'Policía'
  },
  PERSONAL_AMBULANCIA: {
    id: 'personal_ambulancia',
    icono: Ambulance,
    color: 'green',
    colorHex: '#10B981',
    bgGradient: 'from-green-600 to-emerald-700',
    bgLight: 'bg-green-100',
    textLight: 'text-green-600',
    label: 'Paramédico'
  },
  
  // Alertas
  ALERTA_PANICO: {
    id: 'alerta_panico',
    icono: AlertTriangle,
    color: 'red',
    colorHex: '#EF4444',
    bgGradient: 'from-red-600 to-rose-700',
    bgLight: 'bg-red-100',
    textLight: 'text-red-600',
    label: 'Alerta de Pánico'
  },
  ALERTA_MEDICA: {
    id: 'alerta_medica',
    icono: Heart,
    color: 'green',
    colorHex: '#10B981',
    bgGradient: 'from-green-600 to-emerald-700',
    bgLight: 'bg-green-100',
    textLight: 'text-green-600',
    label: 'Alerta Médica'
  },
  ALERTA_EN_PROCESO: {
    id: 'alerta_en_proceso',
    icono: Activity,
    color: 'yellow',
    colorHex: '#EAB308',
    bgGradient: 'from-yellow-500 to-amber-600',
    bgLight: 'bg-yellow-100',
    textLight: 'text-yellow-600',
    label: 'En Proceso'
  },
  ALERTA_CERRADA: {
    id: 'alerta_cerrada',
    icono: CheckCircle,
    color: 'gray',
    colorHex: '#6B7280',
    bgGradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-600',
    label: 'Cerrada'
  },
  ALERTA_EXPIRADA: {
    id: 'alerta_expirada',
    icono: XCircle,
    color: 'gray',
    colorHex: '#6B7280',
    bgGradient: 'from-gray-500 to-gray-600',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-600',
    label: 'Expirada'
  },
  
  // Acciones y Navegación
  MAPA: {
    id: 'mapa',
    icono: MapPinned,
    color: 'blue',
    colorHex: '#3B82F6',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-600',
    label: 'Mapa'
  },
  UBICACION: {
    id: 'ubicacion',
    icono: MapPin,
    color: 'red',
    colorHex: '#EF4444',
    bgLight: 'bg-red-100',
    textLight: 'text-red-600',
    label: 'Ubicación'
  },
  TIEMPO: {
    id: 'tiempo',
    icono: Timer,
    color: 'amber',
    colorHex: '#F59E0B',
    bgLight: 'bg-amber-100',
    textLight: 'text-amber-600',
    label: 'Tiempo'
  },
  RELOJ: {
    id: 'reloj',
    icono: Clock,
    color: 'gray',
    colorHex: '#6B7280',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-600',
    label: 'Fecha'
  },
  CALENDARIO: {
    id: 'calendario',
    icono: Calendar,
    color: 'gray',
    colorHex: '#6B7280',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-600',
    label: 'Fecha'
  },
  UNIDAD: {
    id: 'unidad',
    icono: Truck,
    color: 'blue',
    colorHex: '#3B82F6',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-600',
    label: 'Unidad'
  },
  CIUDADANO: {
    id: 'ciudadano',
    icono: User,
    color: 'purple',
    colorHex: '#8B5CF6',
    bgLight: 'bg-purple-100',
    textLight: 'text-purple-600',
    label: 'Ciudadano'
  },
  TELEFONO: {
    id: 'telefono',
    icono: Phone,
    color: 'green',
    colorHex: '#10B981',
    bgLight: 'bg-green-100',
    textLight: 'text-green-600',
    label: 'Teléfono'
  },
  EMAIL: {
    id: 'email',
    icono: Mail,
    color: 'blue',
    colorHex: '#3B82F6',
    bgLight: 'bg-blue-100',
    textLight: 'text-blue-600',
    label: 'Email'
  }
};

export const getIconConfig = (entidadId) => {
  return ENTIDADES[entidadId] || ENTIDADES.PATRULLA;
};

export const getColorByTipoAlerta = (tipo) => {
  return tipo === 'panico' ? ENTIDADES.ALERTA_PANICO : ENTIDADES.ALERTA_MEDICA;
};

export default ENTIDADES;