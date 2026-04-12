import { useEffect, useState } from 'react';
import { Shield, Users, AlertTriangle, CheckCircle, ChevronRight, TrendingUp } from 'lucide-react';
import axiosInstance from '../../services/api/axiosConfig';

const ConsumoPlan = ({ tenantId }) => {
    const [limites, setLimites] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState(false);

    useEffect(() => {
        const cargarLimites = async () => {
            try {
                const response = await axiosInstance.get('/admin/tenants/plan/limites');
                if (response.data.success) {
                    setLimites(response.data.data);
                }
            } catch (error) {
                console.error('Error cargando límites:', error);
            } finally {
                setLoading(false);
            }
        };
        if (tenantId) cargarLimites();
    }, [tenantId]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 mb-6 border border-gray-100">
                <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-16 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }
    
    if (!limites) return null;

    const rolesConLimite = Object.entries(limites.roles).filter(([_, data]) => data.limite > 0);
    
    // Verificar si algún rol está cerca del límite (80% o más)
    const rolesCercaDelLimite = rolesConLimite.filter(([_, data]) => {
        const porcentaje = (data.actual / data.limite) * 100;
        return porcentaje >= 80 && data.actual < data.limite;
    });

    // Verificar si algún rol alcanzó el límite
    const rolesEnLimite = rolesConLimite.filter(([_, data]) => data.actual >= data.limite);

    const nombresRol = {
        admin: 'Administradores',
        operador_tecnico: 'Operadores Técnicos',
        operador_medico: 'Operadores Médicos',
        operador_policial: 'Operadores Policiales',
        operador_general: 'Operadores Generales'
    };

    const hayAlertas = rolesEnLimite.length > 0 || rolesCercaDelLimite.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden mb-6 border border-gray-100 transition-all">
            {/* Cabecera - Siempre visible */}
            <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandido(!expandido)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            Plan {limites.plan}
                            {hayAlertas && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                    {rolesEnLimite.length > 0 ? 'Límite alcanzado' : 'Cerca del límite'}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {rolesConLimite.length} roles con límite • Policías/Paramédicos ILIMITADOS
                        </p>
                    </div>
                </div>
                <ChevronRight 
                    size={20} 
                    className={`text-gray-400 transition-transform ${expandido ? 'rotate-90' : ''}`} 
                />
            </div>

            {/* Contenido expandible */}
            {expandido && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    {/* Alertas */}
                    {rolesEnLimite.length > 0 && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                            <div className="flex items-center gap-2 text-red-700 mb-2">
                                <div className="bg-red-100 p-1.5 rounded-lg">
                                    <AlertTriangle size={14} />
                                </div>
                                <span className="font-medium text-sm">Has alcanzado el límite en:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {rolesEnLimite.map(([rol, data]) => (
                                    <div key={rol} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                        <span className="text-sm text-gray-700">{nombresRol[rol] || rol}</span>
                                        <span className="text-sm font-bold text-red-600">{data.actual}/{data.limite}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {rolesCercaDelLimite.length > 0 && rolesEnLimite.length === 0 && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-700 mb-2">
                                <div className="bg-amber-100 p-1.5 rounded-lg">
                                    <TrendingUp size={14} />
                                </div>
                                <span className="font-medium text-sm">Estás cerca del límite en:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {rolesCercaDelLimite.map(([rol, data]) => (
                                    <div key={rol} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                                        <span className="text-sm text-gray-700">{nombresRol[rol] || rol}</span>
                                        <span className="text-sm font-bold text-amber-600">{data.actual}/{data.limite}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Barras de progreso */}
                    <div className="space-y-4">
                        {rolesConLimite.map(([rol, data]) => {
                            const porcentaje = Math.min((data.actual / data.limite) * 100, 100);
                            const estaLleno = data.actual >= data.limite;
                            const estaCerca = porcentaje >= 80 && !estaLleno;
                            
                            return (
                                <div key={rol}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">{nombresRol[rol] || rol}</span>
                                            {estaLleno && (
                                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">Lleno</span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-semibold ${
                                            estaLleno ? 'text-red-600' : 
                                            estaCerca ? 'text-amber-600' : 
                                            'text-gray-700'
                                        }`}>
                                            {data.actual} <span className="text-gray-400 font-normal">/ {data.limite}</span>
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                                estaLleno ? 'bg-gradient-to-r from-red-500 to-rose-500' : 
                                                estaCerca ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 
                                                'bg-gradient-to-r from-blue-500 to-indigo-500'
                                            }`}
                                            style={{ width: `${porcentaje}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ILIMITADOS */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                                <div className="bg-emerald-100 p-1 rounded-md">
                                    <Users size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-700 font-medium">Policías/Paramédicos</p>
                                    <p className="text-xs text-emerald-600">ILIMITADOS</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                                <div className="bg-emerald-100 p-1 rounded-md">
                                    <CheckCircle size={14} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-700 font-medium">Unidades</p>
                                    <p className="text-xs text-emerald-600">ILIMITADAS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumen compacto cuando está colapsado */}
            {!expandido && rolesConLimite.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-3">
                    {rolesConLimite.slice(0, 3).map(([rol, data]) => {
                        const porcentaje = Math.min((data.actual / data.limite) * 100, 100);
                        const estaLleno = data.actual >= data.limite;
                        const estaCerca = porcentaje >= 80 && !estaLleno;
                        
                        return (
                            <div key={rol} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                                <span className="text-xs text-gray-600">{nombresRol[rol] || rol}:</span>
                                <span className={`text-xs font-semibold ${
                                    estaLleno ? 'text-red-600' : 
                                    estaCerca ? 'text-amber-600' : 
                                    'text-gray-700'
                                }`}>
                                    {data.actual}/{data.limite}
                                </span>
                                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${
                                            estaLleno ? 'bg-red-500' : 
                                            estaCerca ? 'bg-amber-500' : 
                                            'bg-blue-500'
                                        }`}
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {rolesConLimite.length > 3 && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                            +{rolesConLimite.length - 3} más
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConsumoPlan;