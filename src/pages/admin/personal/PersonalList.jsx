import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Power, RotateCcw, Shield, Ambulance,
  User, Mail, Phone, MoreVertical, Download
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import ReporteBase from '../../../components/reportes/ReporteBase';

const PersonalList = () => {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [filtros, setFiltros] = useState({
    rol: '',
    activo: '',
    disponible: '',
    search: '',
    pagina: 1,
    limite: 10,
    mostrarEliminados: false
  });
  const [paginacion, setPaginacion] = useState({
    total: 0,
    pagina: 1,
    limite: 10,
    total_paginas: 0
  });
  const searchTerm = useDebounce(filtros.search, 500);

  useEffect(() => {
    console.log("🔄 Cargando datos con filtros:", filtros);
    cargarPersonal();
  }, [
    filtros.pagina,
    filtros.limite,
    filtros.rol,
    filtros.activo,
    filtros.disponible,
    searchTerm,
    filtros.mostrarEliminados
  ]);

  const cargarPersonal = async () => {
    setLoading(true);
    try {
      const filtrosActivos = {};

      if (filtros.rol && filtros.rol !== '') {
        filtrosActivos.rol = filtros.rol;
      }
      if (filtros.activo !== undefined && filtros.activo !== '') {
        filtrosActivos.activo = filtros.activo;
      }
      if (filtros.disponible !== undefined && filtros.disponible !== '') {
        filtrosActivos.disponible = filtros.disponible;
      }
      if (filtros.search && filtros.search !== '') {
        filtrosActivos.search = filtros.search;
      }

      if (filtros.mostrarEliminados) {
        filtrosActivos.incluirEliminados = true;
      }

      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;

      console.log("📡 Enviando filtros:", filtrosActivos);
      const response = await personalService.listarPersonal(filtrosActivos);
      console.log("✅ Respuesta:", response);

      setPersonal(response.data || []);
      setPaginacion(response.paginacion || {
        total: response.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: 1
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar personal");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFiltros(prev => ({ ...prev, search: value, pagina: 1 }));
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
  };

  const aplicarFiltros = () => {
    setFiltros(prev => ({ ...prev, pagina: 1 }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      rol: '',
      activo: '',
      disponible: '',
      search: '',
      pagina: 1,
      limite: 10,
      mostrarEliminados: false
    });
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log("🗑️ Eliminando personal ID:", id);
      await personalService.eliminarPersonal(id);
      toast.success(`Personal "${nombre}" eliminado correctamente`);
      cargarPersonal();
    } catch (error) {
      console.error("Error eliminando:", error);
      const mensajeError = error.error || error.message || 'Error al eliminar personal';
      toast.error(mensajeError);
      if (mensajeError.includes('no encontrado')) {
        cargarPersonal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id, nombre, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!window.confirm(`¿Estás seguro de ${accion} a ${nombre}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log(`🔄 ${accion} personal ID:`, id);
      await personalService.toggleActivo(id, nuevoEstado);
      toast.success(`Personal "${nombre}" ${accion}do correctamente`);
      await cargarPersonal();
    } catch (error) {
      console.error(`Error al ${accion}:`, error);
      toast.error(error.error || `Error al ${accion} personal`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de restaurar a ${nombre}?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log("♻️ Restaurando personal ID:", id);
      await personalService.restaurarPersonal(id);
      toast.success(`Personal "${nombre}" restaurado correctamente`);
      await cargarPersonal();
    } catch (error) {
      console.error("Error restaurando:", error);
      toast.error(error.error || 'Error al restaurar personal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de personal operativo y administrativo
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/personal/crear')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Personal
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filtros.mostrarEliminados}
              onChange={(e) => setFiltros(prev => ({ ...prev, mostrarEliminados: e.target.checked, pagina: 1 }))}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mostrar eliminados</span>
          </label>

          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o placa..."
              value={filtros.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtros.rol}
            onChange={(e) => setFiltros(prev => ({ ...prev, rol: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
            <option value="policia">Policía</option>
            <option value="ambulancia">Ambulancia</option>
          </select>

          <select
            value={filtros.activo}
            onChange={(e) => setFiltros(prev => ({ ...prev, activo: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>

          <select
            value={filtros.disponible}
            onChange={(e) => setFiltros(prev => ({ ...prev, disponible: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="true">Disponible</option>
            <option value="false">No disponible</option>
          </select>

          <button
            onClick={aplicarFiltros}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aplicar
          </button>
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
          <button
            onClick={() => setMostrarReporte(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Download size={18} className="text-gray-500" />
            Exportar
          </button>
        </div>
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
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay personal registrado</h3>
            <p className="text-sm text-gray-500 mb-4">Comienza creando un nuevo registro</p>
            <button
              onClick={() => navigate('/admin/personal/crear')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Nuevo Personal
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponible</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {personal.map((persona) => (
                  <tr key={persona.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {persona.nombre?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{persona.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          {persona.email}
                        </p>
                        {persona.telefono && (
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            {persona.telefono}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${persona.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                        persona.rol === 'superadmin' ? 'bg-red-100 text-red-700' :
                          persona.rol === 'policia' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        {persona.rol === 'policia' && <Shield size={12} />}
                        {persona.rol === 'ambulancia' && <Ambulance size={12} />}
                        {persona.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{persona.placa}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${persona.activo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {persona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${persona.disponible
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {persona.disponible ? 'Disponible' : 'Ocupado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {persona.fecha_eliminacion ? (
                          <button
                            onClick={() => handleRestaurar(persona.id, persona.nombre)}
                            className="p-1 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restaurar"
                          >
                            <RotateCcw size={18} className="text-green-600" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleActivo(persona.id, persona.nombre, persona.activo)}
                              className={`p-1 rounded-lg transition-colors ${persona.activo
                                ? 'hover:bg-yellow-50 text-yellow-600'
                                : 'hover:bg-green-50 text-green-600'
                                }`}
                              title={persona.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/personal/${persona.id}`)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye size={18} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => navigate(`/admin/personal/editar/${persona.id}`)}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleEliminar(persona.id, persona.nombre)}
                              className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 size={18} className="text-red-500" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Más opciones"
                            >
                              <MoreVertical size={18} className="text-gray-500" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {paginacion.total > 0 ? ((paginacion.pagina - 1) * paginacion.limite) + 1 : 0} a{' '}
                {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
                {paginacion.total} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarPagina(paginacion.pagina - 1)}
                  disabled={paginacion.pagina === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {paginacion.pagina} de {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => cambiarPagina(paginacion.pagina + 1)}
                  disabled={paginacion.pagina === paginacion.total_paginas}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Reporte */}
      {mostrarReporte && (
        <ReporteBase
          titulo="Reporte de Personal"
          tipo="personal"
          datos={personal.map(p => ({
            id: p.id,
            nombre: p.nombre,
            email: p.email,
            rol: p.rol,
            placa: p.placa,
            telefono: p.telefono || '-',
            activo: p.activo ? 'Sí' : 'No',
            disponible: p.disponible ? 'Sí' : 'No',
            creado_en: new Date(p.creado_en).toLocaleDateString()
          }))}
          columnas={[
            { key: 'id', label: 'ID' },
            { key: 'nombre', label: 'Nombre' },
            { key: 'email', label: 'Email' },
            { key: 'rol', label: 'Rol' },
            { key: 'placa', label: 'Placa' },
            { key: 'activo', label: 'Activo' },
            { key: 'disponible', label: 'Disponible' },
            { key: 'creado_en', label: 'Fecha Creación' }
          ]}
          onClose={() => setMostrarReporte(false)}
        />
      )}
    </div>
  );
};

export default PersonalList;