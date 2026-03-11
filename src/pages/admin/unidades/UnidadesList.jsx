import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Plus, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, Trash2, Power, RotateCcw, Shield, Ambulance,
  MapPin, Users, MoreVertical, Download
} from 'lucide-react';
import unidadService from '../../../services/admin/unidad.service';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../hooks/useDebounce';
import ReporteBase from '../../../components/reportes/ReporteBase';

const UnidadesList = () => {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
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

  const cargarUnidades = useCallback(async () => {
    setLoading(true);
    try {
      const filtrosActivos = {};
      if (filtros.tipo) filtrosActivos.tipo = filtros.tipo;
      if (filtros.estado) filtrosActivos.estado = filtros.estado;
      if (searchTerm) filtrosActivos.search = searchTerm;
      filtrosActivos.pagina = filtros.pagina;
      filtrosActivos.limite = filtros.limite;

      const response = await unidadService.listarUnidades(filtrosActivos);
      setUnidades(response.data || []);
      setPaginacion(response.paginacion || {
        total: response.data?.length || 0,
        pagina: filtros.pagina,
        limite: filtros.limite,
        total_paginas: 1
      });
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 429) {
        toast.error('⏳ Demasiadas peticiones. Espera unos segundos...');
      } else {
        toast.error('Error al cargar unidades');
      }
    } finally {
      setLoading(false);
    }
  }, [filtros.tipo, filtros.estado, searchTerm, filtros.pagina, filtros.limite]);

  useEffect(() => {
    cargarUnidades();
  }, [cargarUnidades]);

  const handleEliminar = async (id, codigo) => {
    if (!window.confirm(`¿Estás seguro de eliminar la unidad ${codigo}?`)) return;

    try {
      await unidadService.eliminarUnidad(id);
      toast.success('Unidad eliminada correctamente');
      cargarUnidades();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('⏳ Demasiadas peticiones. Espera unos segundos...');
      } else {
        toast.error(error.error || 'Error al eliminar');
      }
    }
  };

  const handleToggleActivo = async (id, codigo, activa) => {
    const estadoAnterior = unidades.find(u => u.id === id);

    setUnidades(prevUnidades =>
      prevUnidades.map(u =>
        u.id === id
          ? {
            ...u,
            activa: !activa,
            estado: !activa ? 'disponible' : 'inactiva'
          }
          : u
      )
    );

    try {
      const response = await unidadService.toggleActiva(id, !activa);

      if (response.data?.estado) {
        setUnidades(prevUnidades =>
          prevUnidades.map(u =>
            u.id === id
              ? {
                ...u,
                estado: response.data.estado,
                activa: response.data.activa
              }
              : u
          )
        );
        console.log(`✅ Estado confirmado por backend: ${response.data.estado}`);
      }

      toast.success(`✅ Unidad ${!activa ? 'activada' : 'desactivada'}`);
    } catch (error) {
      setUnidades(prevUnidades =>
        prevUnidades.map(u =>
          u.id === id
            ? { ...u, activa: estadoAnterior.activa, estado: estadoAnterior.estado }
            : u
        )
      );

      if (error.response?.status === 429) {
        toast.error('⏳ Demasiadas peticiones. Espera unos segundos...');
      } else {
        toast.error(error.error || 'Error al cambiar estado');
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Unidades</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de unidades operativas
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/unidades/crear')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Nueva Unidad
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={filtros.search}
              onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value, pagina: 1 }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="policia">Policía</option>
            <option value="ambulancia">Ambulancia</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value, pagina: 1 }))}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="ocupada">Ocupada</option>
            <option value="inactiva">Inactiva</option>
          </select>

          <button
            onClick={() => setFiltros(prev => ({ ...prev, pagina: 1 }))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aplicar
          </button>
          
          <button
            onClick={() => setMostrarReporte(true)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
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
            <p className="mt-2 text-gray-500">Cargando unidades...</p>
          </div>
        ) : unidades.length === 0 ? (
          <div className="p-12 text-center">
            <Truck size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay unidades registradas</h3>
            <p className="text-sm text-gray-500 mb-4">Comienza creando una nueva unidad</p>
            <button
              onClick={() => navigate('/admin/unidades/crear')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Nueva Unidad
            </button>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unidades.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${unidad.tipo === 'policia' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                          <Truck size={16} className={unidad.tipo === 'policia' ? 'text-blue-600' : 'text-green-600'} />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{unidad.codigo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${unidad.tipo === 'policia'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                        }`}>
                        {unidad.tipo === 'policia' ? 'Policía' : 'Ambulancia'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${unidad.estado === 'disponible' ? 'bg-green-100 text-green-700' :
                          unidad.estado === 'ocupada' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {unidad.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {unidad.personal_asignado?.length || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {unidad.lat && unidad.lng ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {unidad.lat.toFixed(4)}, {unidad.lng.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sin ubicación</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActivo(unidad.id, unidad.codigo, unidad.activa)}
                          className={`p-1 rounded-lg transition-colors ${unidad.activa
                              ? 'hover:bg-yellow-50 text-yellow-600'
                              : 'hover:bg-green-50 text-green-600'
                            }`}
                          title={unidad.activa ? 'Desactivar' : 'Activar'}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/unidades/${unidad.id}`)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="Ver detalles"
                        >
                          <Eye size={18} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/unidades/editar/${unidad.id}`)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="Editar"
                        >
                          <Edit size={18} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleEliminar(unidad.id, unidad.codigo)}
                          className="p-1 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
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
                {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de {paginacion.total} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
                  disabled={paginacion.pagina === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Página {paginacion.pagina} de {paginacion.total_paginas}
                </span>
                <button
                  onClick={() => setFiltros(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
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
          titulo="Reporte de Unidades"
          tipo="unidades"
          datos={unidades.map(u => ({
            id: u.id,
            codigo: u.codigo,
            tipo: u.tipo,
            estado: u.estado,
            activa: u.activa ? 'Sí' : 'No',
            personal: u.personal_asignado?.length || 0,
            ubicacion: u.lat && u.lng ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}` : 'Sin ubicación',
            creado_en: new Date(u.creado_en).toLocaleDateString()
          }))}
          columnas={[
            { key: 'id', label: 'ID' },
            { key: 'codigo', label: 'Código' },
            { key: 'tipo', label: 'Tipo' },
            { key: 'estado', label: 'Estado' },
            { key: 'activa', label: 'Activa' },
            { key: 'personal', label: 'Personal' },
            { key: 'creado_en', label: 'Fecha Creación' }
          ]}
          onClose={() => setMostrarReporte(false)}
        />
      )}
    </div>
  );
};

export default UnidadesList;