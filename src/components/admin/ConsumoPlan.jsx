import { useEffect, useState } from 'react';
import { Shield, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import axiosInstance from '../../services/api/axiosConfig';

const ConsumoPlan = ({ tenantId }) => {
    const [limites, setLimites] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarLimites = async () => {
            try {
                const response = await axiosInstance.get('/admin/plan/limites');
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

    if (loading) return <div className="animate-pulse bg-gray-200 h-20 rounded-xl"></div>;
    if (!limites) return null;

    const rolesConLimite = Object.entries(limites.roles).filter(([_, data]) => data.limite > 0);
    
    // Verificar si algún rol está cerca del límite (80% o más)
    const rolesCercaDelLimite = rolesConLimite.filter(([_, data]) => {
        const porcentaje = (data.actual / data.limite) * 100;
        return porcentaje >= 80;
    });

    // Verificar si algún rol alcanzó el límite
    const rolesEnLimite = rolesConLimite.filter(([_, data]) => data.actual >= data.limite);

    const nombresRol = {
        admin: 'Administradores',
        operador_tecnico: 'Op. Técnicos',
        operador_medico: 'Op. Médicos',
        operador_policial: 'Op. Policiales',
        operador_general: 'Op. Generales'
    };

    return (
        <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
                <Shield size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Consumo del Plan {limites.plan}</h3>
            </div>

            {/* Alertas de límites */}
            {rolesEnLimite.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Has alcanzado el límite en:</span>
                    </div>
                    <ul className="mt-2 text-sm text-red-600">
                        {rolesEnLimite.map(([rol, data]) => (
                            <li key={rol}>• {nombresRol[rol] || rol}: {data.actual}/{data.limite}</li>
                        ))}
                    </ul>
                </div>
            )}

            {rolesCercaDelLimite.length > 0 && rolesEnLimite.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Estás cerca del límite en:</span>
                    </div>
                    <ul className="mt-2 text-sm text-yellow-600">
                        {rolesCercaDelLimite.map(([rol, data]) => (
                            <li key={rol}>• {nombresRol[rol] || rol}: {data.actual}/{data.limite}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Barras de progreso */}
            <div className="space-y-3">
                {rolesConLimite.map(([rol, data]) => {
                    const porcentaje = Math.min((data.actual / data.limite) * 100, 100);
                    const estaLleno = data.actual >= data.limite;
                    const estaCerca = porcentaje >= 80 && !estaLleno;
                    
                    return (
                        <div key={rol}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">{nombresRol[rol] || rol}</span>
                                <span className={`font-medium ${estaLleno ? 'text-red-600' : estaCerca ? 'text-yellow-600' : 'text-gray-700'}`}>
                                    {data.actual} / {data.limite}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all ${
                                        estaLleno ? 'bg-red-500' : estaCerca ? 'bg-yellow-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${porcentaje}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle size={14} />
                    <span>Policías/Paramédicos: ILIMITADOS</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-600 mt-1">
                    <CheckCircle size={14} />
                    <span>Unidades: ILIMITADAS</span>
                </div>
            </div>
        </div>
    );
};

export default ConsumoPlan;