import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Power, User, Mail, Phone, X, AlertTriangle, CheckCircle,
  ShieldUser, ShieldCheck, ShieldPlus, HandHeart, UserCog, UserMinus, Crown, Star
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import IconoEntidad, { BadgeIcono } from '../../../components/ui/IconoEntidad';
import authService from '../../../services/auth.service';
import useAuthStore from '../../../store/authStore';
import axiosInstance from '../../../services/api/axiosConfig';


// Función para normalizar texto
const normalizarTexto = (texto) => {
  if (!texto) return '';

  const reemplazos = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
    { de: '¡', para: 'í' }, { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }
  ];

  let textoNormalizado = texto;
  reemplazos.forEach(({ de, para }) => {
    if (de.includes(' ') || de.length > 3) {
      textoNormalizado = textoNormalizado.replace(new RegExp(de, 'g'), para);
    } else {
      textoNormalizado = textoNormalizado.split(de).join(para);
    }
  });

  return textoNormalizado;
};

const formatearNombreCompleto = (persona) => {
  if (!persona) return '';
  const { nombre, apellido_paterno, apellido_materno } = persona;
  const nombreNormalizado = normalizarTexto(nombre || '');
  const paternoNormalizado = normalizarTexto(apellido_paterno || '');
  const maternoNormalizado = normalizarTexto(apellido_materno || '');

  const nombreCompleto = [nombreNormalizado, paternoNormalizado, maternoNormalizado]
    .filter(Boolean)
    .join(' ');

  return nombreCompleto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

// Función con iconos según rol
const getIconoPorRol = (rol, size = 18) => {
  const iconos = {
    operador_policial: {
      icon: ShieldUser,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      nombre: 'Operador Policial'
    },
    operador_medico: {
      icon: HandHeart,
      color: 'text-green-600',
      bg: 'bg-green-100',
      nombre: 'Operador Médico'
    },
    operador_tecnico: {
      icon: UserCog,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      nombre: 'Operador Técnico'
    },
    operador_general: {
      icon: UserMinus,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      nombre: 'Operador General'
    },
    admin: {
      icon: Crown,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      nombre: 'Administrador'
    },
    superadmin: {
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      nombre: 'Super Administrador'
    },
    policia: {
      icon: ShieldCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      nombre: 'Policía'
    },
    paramedico: {
      icon: ShieldPlus,
      color: 'text-green-600',
      bg: 'bg-green-100',
      nombre: 'Paramédico'
    }
  };

  const config = iconos[rol];

  if (config) {
    const IconComponent = config.icon;
    return {
      contenido: <IconComponent size={size} className={config.color} />,
      bgColor: config.bg,
      esIcono: true,
      nombreMostrar: config.nombre
    };
  }

  return {
    contenido: null,
    bgColor: 'bg-gray-100',
    esIcono: false,
    nombreMostrar: rol
  };
};

// Mapeo de roles a entidades para badges (fallback)
const rolToEntidad = {
  admin: 'ADMIN',
  superadmin: 'SUPERADMIN',
  policia: 'POLICIA',
  paramedico: 'PARAMEDICO',
  operador_tecnico: 'OPERADOR_TECNICO',
  operador_policial: 'OPERADOR_POLICIAL',
  operador_medico: 'OPERADOR_MEDICO',
  operador_general: 'OPERADOR_GENERAL'
};

const PersonalList = () => {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState([]);
  const [personalOriginal, setPersonalOriginal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState({
    show: false,
    tipo: '',
    titulo: '',
    mensaje: '',
    onConfirm: null
  });


  const abortControllerRef = useRef(null);
  const rolPersonalPermitido = authService.getRolPersonalPermitido();
  const currentUser = authService.getCurrentUser(); // ✅ AGREGADO para el select de roles


  const puedeEditarPersonal = (rol) => authService.puedeEditarPersonal(rol);
  const puedeEliminarPersonal = (rol) => authService.puedeEliminarPersonal(rol);
  const [limiteInfo, setLimiteInfo] = useState(null);
  useEffect(() => {
    const cargarLimites = async () => {
      try {
        const response = await axiosInstance.get('/admin/tenants/plan/limites');
        if (response.data.success) {
          setLimiteInfo(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando límites:', error);
      }
    };
    cargarLimites();
  }, []);



  // Función puedeCrearPersonal usando authService
  const puedeCrearPersonal = () => {
    const user = authService.getCurrentUser();
    if (!user) return false;

    const rolUsuario = user.rol;

    // Superadmin y admin siempre pueden crear personal
    if (rolUsuario === 'superadmin' || rolUsuario === 'admin') return true;

    // Operadores pueden crear personal de su propio tipo
    if (rolUsuario === 'operador_policial') return true;
    if (rolUsuario === 'operador_medico') return true;

    return false;
  };

  const [filtros, setFiltros] = useState({
    rol: rolPersonalPermitido || '',
    activo: '',
    disponible: '',
    search: '',
    pagina: 1,
    limite: 10
  });

  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });

  const searchTerm = useDebounce(filtros.search, 500);

  const filtrarDatos = useCallback((datos) => {
    return datos.filter(item => {
      if (filtros.search) {
        const termino = filtros.search.toLowerCase().trim();
        const nombreMatch = item.nombreCompleto?.toLowerCase().includes(termino);
        const emailMatch = item.email?.toLowerCase().includes(termino);
        const placaMatch = item.placa?.toLowerCase().includes(termino);
        if (!nombreMatch && !emailMatch && !placaMatch) return false;
      }

      if (filtros.rol && item.rol !== filtros.rol) return false;

      if (filtros.activo !== undefined && filtros.activo !== '') {
        const activoBool = filtros.activo === 'true';
        if (item.activo !== activoBool) return false;
      }

      if (filtros.disponible !== undefined && filtros.disponible !== '') {
        const disponibleBool = filtros.disponible === 'true';
        if (item.disponible !== disponibleBool) return false;
      }

      return true;
    });
  }, [filtros.search, filtros.rol, filtros.activo, filtros.disponible]);

  // Enviar filtro de seguridad como filtroRol
  const cargarPersonal = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Petición anterior cancelada en PersonalList');
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const params = {
        signal: abortControllerRef.current.signal,
        limite: 1000
      };

      // Enviar filtro de seguridad como filtroRol (el backend lo aplica con prioridad)
      if (rolPersonalPermitido) {
        params.filtroRol = { rol: rolPersonalPermitido };
      }

      const response = await personalService.listarPersonal(params);

      const personalFormateado = (response.data || []).map(p => {
        const nombreCompleto = formatearNombreCompleto(p);
        return {
          ...p,
          nombreCompleto,
          email: p.email,
          telefono: p.telefono,
          placa: p.placa?.toUpperCase(),
          rol: p.rol,
          disponible: p.activo ? p.disponible : false,
          estadoTexto: p.activo ? 'Activo' : 'Inactivo',
          disponibleTexto: p.activo ? (p.disponible ? 'Disponible' : 'Ocupado') : 'No disponible'
        };
      });

      setPersonalOriginal(personalFormateado);

      const datosFiltrados = filtrarDatos(personalFormateado);
      const total = datosFiltrados.length;
      const totalPaginas = Math.ceil(total / filtros.limite);
      const inicio = (filtros.pagina - 1) * filtros.limite;
      const fin = inicio + filtros.limite;
      const datosPaginados = datosFiltrados.slice(inicio, fin);

      setPersonal(datosPaginados);
      setPaginacion({
        total,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: totalPaginas
      });
    } catch (error) {
      if (error.name !== 'AbortError' && error.code !== 'ERR_CANCELED') {
        console.error("Error:", error);
        toast.error("Error al cargar personal");
      }
    } finally {
      setLoading(false);
    }
  }, [rolPersonalPermitido, filtros.limite, filtros.pagina, filtrarDatos]);

  useEffect(() => {
    cargarPersonal();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🛑 Componente PersonalList desmontado - peticiones canceladas');
      }
    };
  }, [cargarPersonal]);

  const handleSearch = (value) => {
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      rol: rolPersonalPermitido || '',
      activo: '',
      disponible: '',
      search: '',
      pagina: 1,
      limite: 10
    });
  };

  useEffect(() => {
    if (personalOriginal.length) {
      const datosFiltrados = filtrarDatos(personalOriginal);
      const total = datosFiltrados.length;
      const totalPaginas = Math.ceil(total / filtros.limite);
      const inicio = (filtros.pagina - 1) * filtros.limite;
      const fin = inicio + filtros.limite;
      const datosPaginados = datosFiltrados.slice(inicio, fin);

      setPersonal(datosPaginados);
      setPaginacion({
        total,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: totalPaginas
      });
    }
  }, [filtros.rol, filtros.activo, filtros.disponible, filtros.search, filtros.pagina, filtros.limite, personalOriginal, filtrarDatos]);

  const handleEliminar = async (id, nombreCompleto, disponible, rolPersonal) => {
    if (!puedeEliminarPersonal(rolPersonal)) {
      toast.error('No tienes permisos para eliminar este personal');
      return;
    }

    if (!disponible) {
      setModalInfo({
        show: true,
        tipo: 'error',
        titulo: 'Acción no permitida',
        mensaje: `No es posible eliminar a ${nombreCompleto} porque se encuentra en servicio activo atendiendo una emergencia.`,
        onConfirm: null
      });
      return;
    }

    setModalInfo({
      show: true,
      tipo: 'confirm',
      titulo: 'Confirmar eliminación',
      mensaje: `¿Está seguro de eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await personalService.eliminarPersonal(id);
          setModalInfo({ show: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
          await cargarPersonal();
          toast.success(`Personal "${nombreCompleto}" eliminado correctamente`);
        } catch (error) {
          console.error("Error eliminando:", error);
          toast.error(error.error || 'Error al eliminar personal');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleToggleActivo = async (id, nombreCompleto, estadoActual, disponible, rolPersonal) => {
    if (!puedeEditarPersonal(rolPersonal)) {
      toast.error('No tienes permisos para modificar este personal');
      return;
    }

    if (estadoActual && !disponible) {
      setModalInfo({
        show: true,
        tipo: 'error',
        titulo: 'Acción no permitida',
        mensaje: `No es posible desactivar a ${nombreCompleto} mientras se encuentra en servicio activo.`,
        onConfirm: null
      });
      return;
    }

    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    let mensajeConfirm = `¿Está seguro de ${accion} a ${nombreCompleto}?`;
    if (!nuevoEstado) {
      mensajeConfirm = `¿Está seguro de desactivar a ${nombreCompleto}? Al desactivarlo, no podrá recibir nuevas alertas.`;
    }

    setModalInfo({
      show: true,
      tipo: 'confirm',
      titulo: `Confirmar ${accion}`,
      mensaje: mensajeConfirm,
      onConfirm: async () => {
        setLoading(true);
        try {
          await personalService.toggleActivo(id, nuevoEstado);
          setModalInfo({ show: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
          await cargarPersonal();
          toast.success(`Personal "${nombreCompleto}" ${accion}do correctamente`);
        } catch (error) {
          console.error(`Error al ${accion}:`, error);
          toast.error(error.error || `Error al ${accion} personal`);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const inicio = paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0;
  const fin = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg shadow-blue-200">
              <Users size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Personal</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Gestión de personal operativo y administrativo
                {rolPersonalPermitido && ` (${rolPersonalPermitido === 'policia' ? 'Solo Policía' : 'Solo Paramédico'})`}
              </p>
            </div>
          </div>
          {puedeCrearPersonal() && (
            <div className="flex items-center gap-2">
              {/* ✅ Mostrar badges de advertencia para roles que alcanzaron su límite */}
              {limiteInfo && Object.entries(limiteInfo.roles || {})
                .filter(([_, data]) => data.limite > 0 && data.actual >= data.limite)
                .map(([rol]) => {
                  const nombresRol = {
                    admin: 'Administradores',
                    operador_tecnico: 'Op. Técnicos',
                    operador_medico: 'Op. Médicos',
                    operador_policial: 'Op. Policiales',
                    operador_general: 'Op. Generales'
                  };
                  return (
                    <span key={rol} className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <AlertTriangle size={12} />
                      {nombresRol[rol] || rol} lleno
                    </span>
                  );
                })
              }

              {/* ✅ BOTÓN SIEMPRE HABILITADO */}
              <button
                onClick={() => navigate('/admin/personal/crear')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus size={18} />
                <span>Nuevo Personal</span>
              </button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o placa..."
                value={filtros.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filtros.search && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* ✅ SELECT DE ROLES CORREGIDO - AHORA FUNCIONA PARA OPERADORES */}
            <select
              value={filtros.rol}
              onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value, pagina: 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los roles</option>

              {(!rolPersonalPermitido || currentUser?.rol === 'admin' || currentUser?.rol === 'superadmin') && (
                <>
                  <option value="admin">Admin</option>
                  {/* ✅ SOLO SUPERADMIN VE ESTA OPCIÓN */}
                  {currentUser?.rol === 'superadmin' && (
                    <option value="superadmin">Superadmin</option>
                  )}
                  <option value="operador_policial">Operador Policial</option>
                  <option value="operador_medico">Operador Médico</option>
                  <option value="operador_tecnico">Operador Técnico</option>
                  <option value="operador_general">Operador General</option>
                  <option value="policia">Policía</option>
                  <option value="paramedico">Paramédico</option>
                </>
              )}

              {/* Operador policial solo ve sus roles */}
              {rolPersonalPermitido === 'policia' && (
                <>
                  <option value="policia">Policía</option>
                  <option value="operador_policial">Operador Policial</option>
                </>
              )}

              {/* Operador médico solo ve sus roles */}
              {rolPersonalPermitido === 'paramedico' && (
                <>
                  <option value="paramedico">Paramédico</option>
                  <option value="operador_medico">Operador Médico</option>
                </>
              )}
            </select>

            <select
              value={filtros.activo}
              onChange={(e) => setFiltros(prev => ({ ...prev, activo: e.target.value, pagina: 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>

            <select
              value={filtros.disponible}
              onChange={(e) => setFiltros(prev => ({ ...prev, disponible: e.target.value, pagina: 1 }))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos</option>
              <option value="true">Disponible</option>
              <option value="false">Ocupado</option>
            </select>

            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap border border-gray-300"
            >
              Limpiar
            </button>
          </div>

          {(filtros.rol || filtros.activo || filtros.disponible || filtros.search) && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-blue-600 font-medium">Filtros aplicados - {paginacion.total} resultados</span>
            </div>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando personal...</p>
            </div>
          ) : personal.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No se encontraron resultados</h3>
              <p className="text-sm text-gray-500 mb-4">Intenta con otros criterios de búsqueda</p>
              <button
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Filter size={16} />
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponible</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {personal.map((persona) => {
                      const iconoConfig = getIconoPorRol(persona.rol);
                      const textoRol =
                        persona.rol === 'policia' ? 'Policía' :
                          persona.rol === 'paramedico' ? 'Paramédico' :
                            persona.rol === 'admin' ? 'Admin' :
                              persona.rol === 'superadmin' ? 'Superadmin' :
                                persona.rol === 'operador_policial' ? 'Op. Policial' :
                                  persona.rol === 'operador_medico' ? 'Op. Médico' :
                                    persona.rol === 'operador_tecnico' ? 'Op. Técnico' :
                                      persona.rol === 'operador_general' ? 'Op. General' : persona.rol;

                      return (
                        <tr key={persona.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconoConfig.bgColor}`}>
                                {iconoConfig.esIcono ? iconoConfig.contenido : (
                                  <span className="text-gray-600 font-medium text-sm">
                                    {persona.nombreCompleto?.charAt(0).toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                                  {persona.nombreCompleto}
                                </p>
                                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                  {iconoConfig.nombreMostrar}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                <span className="truncate max-w-[150px]">{persona.email}</span>
                              </p>
                              {persona.telefono && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Phone size={14} className="text-gray-400" />
                                  {persona.telefono}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${iconoConfig.bgColor}`}>
                              {iconoConfig.esIcono && iconoConfig.contenido}
                              <span className={iconoConfig.esIcono ? iconoConfig.color : 'text-gray-700'}>
                                {textoRol}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{persona.placa}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${persona.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                              {persona.estadoTexto}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${!persona.activo ? 'bg-gray-100 text-gray-700' :
                              persona.disponible ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {persona.disponibleTexto}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {puedeEditarPersonal(persona.rol) && (
                                <button
                                  onClick={() => handleToggleActivo(persona.id, persona.nombreCompleto, persona.activo, persona.disponible, persona.rol)}
                                  className={`p-1.5 rounded-lg transition-colors ${persona.activo ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'
                                    }`}
                                  title={persona.activo ? 'Desactivar' : 'Activar'}
                                >
                                  <Power size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/admin/personal/${persona.id}`)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                                title="Ver detalles"
                              >
                                <Eye size={16} className="text-gray-500" />
                              </button>
                              {puedeEditarPersonal(persona.rol) && (
                                <button
                                  onClick={() => navigate(`/admin/personal/editar/${persona.id}`)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                                  title="Editar"
                                >
                                  <Edit size={16} className="text-gray-500" />
                                </button>
                              )}
                              {puedeEliminarPersonal(persona.rol) && (
                                <button
                                  onClick={() => handleEliminar(persona.id, persona.nombreCompleto, persona.disponible, persona.rol)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  Mostrando <span className="font-medium">{inicio}</span> a <span className="font-medium">{fin}</span> de{' '}
                  <span className="font-medium">{paginacion.total}</span> registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Página {paginacion.pagina} de {paginacion.total_paginas}
                  </span>
                  <button
                    onClick={() => cambiarPagina(paginacion.pagina + 1)}
                    disabled={paginacion.pagina === paginacion.total_paginas}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Genérico */}
      {modalInfo.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${modalInfo.tipo === 'error' ? 'bg-red-100' :
                  modalInfo.tipo === 'success' ? 'bg-green-100' :
                    modalInfo.tipo === 'confirm' ? 'bg-yellow-100' :
                      'bg-blue-100'
                  }`}>
                  {modalInfo.tipo === 'error' && <AlertTriangle size={24} className="text-red-600" />}
                  {modalInfo.tipo === 'success' && <CheckCircle size={24} className="text-green-600" />}
                  {modalInfo.tipo === 'confirm' && <AlertTriangle size={24} className="text-yellow-600" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{modalInfo.titulo}</h3>
              </div>

              <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">{modalInfo.mensaje}</p>

              <div className="flex justify-end gap-3">
                {modalInfo.tipo === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setModalInfo({ show: false, tipo: '', titulo: '', mensaje: '', onConfirm: null })}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (modalInfo.onConfirm) modalInfo.onConfirm();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (modalInfo.onConfirm) {
                        modalInfo.onConfirm();
                      } else {
                        setModalInfo({ show: false, tipo: '', titulo: '', mensaje: '', onConfirm: null });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {modalInfo.tipo === 'error' ? 'Entendido' : 'Aceptar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalList;