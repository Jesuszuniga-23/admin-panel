// src/components/common/TenantSelector.jsx
import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { obtenerTenantActual, guardarTenant } from '../../utils/storage';
import useAuthStore from '../../store/authStore';
import axiosInstance from '../../services/api/axiosConfig';
import toast from 'react-hot-toast';

const TenantSelector = () => {
  const { user, setCurrentTenant } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [currentTenant, setCurrentTenantState] = useState('default');
  const [loading, setLoading] = useState(false);
  const [cargandoTenants, setCargandoTenants] = useState(false);
  const dropdownRef = useRef(null);

  // Solo superadmin puede cambiar de tenant
  const isSuperAdmin = user?.rol === 'superadmin';

  // Cargar tenant actual
  useEffect(() => {
    const tenant = obtenerTenantActual();
    setCurrentTenantState(tenant);
  }, []);

  // Cargar lista de tenants (solo para superadmin)
 const cargarTenants = async () => {
    setLoading(true);
    try {
        console.log('🔍 Fetching tenants con fetch...');
        
        const response = await fetch('https://backend-emergencias.onrender.com/api/admin/tenants', {
            credentials: 'include',
            headers: {
                'X-Tenant-ID': 'default',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📦 Respuesta fetch:', data);
        
        if (data.success && data.data) {
            let filteredTenants = [...data.data];
            
            // Filtrar por búsqueda
            if (searchDebounced && searchDebounced.trim() !== '') {
                const searchLower = searchDebounced.toLowerCase().trim();
                filteredTenants = filteredTenants.filter(t => {
                    const nombre = t.nombre ? String(t.nombre).toLowerCase() : '';
                    const id = t.id ? String(t.id).toLowerCase() : '';
                    return nombre.includes(searchLower) || id.includes(searchLower);
                });
            }
            
            // Filtrar por estado
            if (statusFilter) {
                filteredTenants = filteredTenants.filter(t => t.status === statusFilter);
            }
            
            // Filtrar por plan
            if (planFilter) {
                filteredTenants = filteredTenants.filter(t => t.plan_id === planFilter);
            }
            
            // Excluir default
            filteredTenants = filteredTenants.filter(t => t.id !== 'default');
            
            setTenants(filteredTenants);
        } else {
            toast.error(data.error || 'Error al cargar municipios');
        }
    } catch (error) {
        console.error('Error cargando tenants:', error);
        toast.error('Error al cargar municipios');
    } finally {
        setLoading(false);
    }
};

  // Abrir dropdown y cargar tenants
  const handleOpen = () => {
    if (!isSuperAdmin) return;
    setIsOpen(true);
    if (tenants.length === 0) {
      cargarTenants();
    }
  };

  // Cambiar tenant
  const handleChangeTenant = async (tenantId, tenantNombre) => {
    if (!isSuperAdmin) return;
    
    setLoading(true);
    try {
      // Guardar tenant en localStorage
      guardarTenant(tenantId);
      setCurrentTenantState(tenantId);
      
      // Actualizar store
      if (setCurrentTenant) {
        setCurrentTenant(tenantId);
      }
      
      toast.success(`Cambiado a municipio: ${tenantNombre}`);
      
      // Cerrar dropdown
      setIsOpen(false);
      
      // Recargar la página para aplicar cambios
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error cambiando tenant:', error);
      toast.error('Error al cambiar de municipio');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Si no es superadmin, no mostrar nada
  if (!isSuperAdmin) {
    return null;
  }

  // Obtener nombre del tenant actual
  const currentTenantNombre = tenants.find(t => t.id === currentTenant)?.nombre || 
    (currentTenant === 'default' ? 'Sistema Principal' : currentTenant);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
      >
        <Building2 size={16} className="text-gray-500" />
        <span className="max-w-[120px] truncate">
          {currentTenantNombre}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Municipios disponibles</span>
              <button
                onClick={cargarTenants}
                disabled={cargandoTenants}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw size={12} className={cargandoTenants ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {cargandoTenants ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xs text-gray-400 mt-2">Cargando...</p>
              </div>
            ) : tenants.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No hay municipios registrados
              </div>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleChangeTenant(tenant.id, tenant.nombre)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                    currentTenant === tenant.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-sm ${currentTenant === tenant.id ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      {tenant.nombre}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{tenant.id}</span>
                  </div>
                  {currentTenant === tenant.id && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              Cambiar municipio recargará la página
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;