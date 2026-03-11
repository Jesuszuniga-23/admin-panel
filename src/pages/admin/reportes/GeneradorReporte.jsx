import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Filter, Download,
  Loader, Users, Truck, Bell, FileSpreadsheet,
  FilePieChart, Eye, X, RefreshCw
} from 'lucide-react';
import personalService from '../../../services/admin/personal.service';
import unidadService from '../../../services/admin/unidad.service';
import alertasService from '../../../services/admin/alertas.service';
import reportesService from '../../../services/admin/reportes.service';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';

const GeneradorReporte = () => {
  const navigate = useNavigate();
  const { tipo } = useParams();
  const { user } = useAuthStore();
  
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState([]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: 'todos',
    estado: 'todos',
    busqueda: ''
  });
  const [vistaPrevia, setVistaPrevia] = useState(true);

  // Configuración según el tipo de reporte
  const config = {
    personal: {
      titulo: 'Reporte de Personal',
      icono: Users,
      color: 'blue',
      campos: [
        { key: 'nombre', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'rol', label: 'Rol' },
        { key: 'placa', label: 'Placa' },
        { key: 'activo', label: 'Activo' },
        { key: 'disponible', label: 'Disponible' }
      ],
      filtrosDisponibles: [
        { tipo: 'rol', opciones: ['policia', 'ambulancia', 'admin', 'superadmin'] },
        { tipo: 'estado', opciones: ['activo', 'inactivo'] }
      ]
    },
    unidades: {
      titulo: 'Reporte de Unidades',
      icono: Truck,
      color: 'purple',
      campos: [
        { key: 'codigo', label: 'Código' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'activa', label: 'Activa' },
        { key: 'personal_asignado', label: 'Personal' }
      ],
      filtrosDisponibles: [
        { tipo: 'tipo', opciones: ['policia', 'ambulancia'] },
        { tipo: 'estado', opciones: ['disponible', 'ocupada', 'inactiva'] }
      ]
    },
    alertas: {
      titulo: 'Reporte de Alertas',
      icono: Bell,
      color: 'amber',
      campos: [
        { key: 'id', label: 'ID' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'estado', label: 'Estado' },
        { key: 'expirada', label: 'Expirada' },
        { key: 'cerrada_manualmente', label: 'Cierre Manual' }
      ],
      filtrosDisponibles: [
        { tipo: 'tipo', opciones: ['panico', 'medica'] },
        { tipo: 'estado', opciones: ['activa', 'expirada', 'cerrada'] }
      ]
    }
  };

  const info = config[tipo] || config.personal;

  useEffect(() => {
    cargarDatos();
  }, [tipo]);

  useEffect(() => {
    aplicarFiltros();
  }, [datos, filtros]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let data = [];
      
      if (tipo === 'personal') {
        const res = await personalService.listarPersonal({ limite: 1000 });
        data = res.data || [];
      } else if (tipo === 'unidades') {
        const res = await unidadService.listarUnidades({ limite: 1000 });
        data = res.data || [];
      } else if (tipo === 'alertas') {
        const [exp, cer] = await Promise.all([
          alertasService.obtenerExpiradas({ limite: 1000 }),
          alertasService.obtenerCerradasManual({ limite: 1000 })
        ]);
        data = [...(exp.data || []), ...(cer.data || [])];
      }

      setDatos(data);
      setDatosFiltrados(data);
      toast.success(`${data.length} registros cargados`);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...datos];

    // Filtro por fecha
    if (filtros.fechaInicio) {
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion || item.creado_en);
        return fecha >= new Date(filtros.fechaInicio);
      });
    }

    if (filtros.fechaFin) {
      filtrados = filtrados.filter(item => {
        const fecha = new Date(item.fecha_creacion || item.creado_en);
        return fecha <= new Date(filtros.fechaFin);
      });
    }

    // Filtro por tipo
    if (filtros.tipo !== 'todos') {
      filtrados = filtrados.filter(item => 
        item.tipo === filtros.tipo || item.rol === filtros.tipo
      );
    }

    // Filtro por estado
    if (filtros.estado !== 'todos') {
      filtrados = filtrados.filter(item => {
        if (tipo === 'personal') return item.activo === (filtros.estado === 'activo');
        if (tipo === 'unidades') return item.estado === filtros.estado;
        if (tipo === 'alertas') return item.estado === filtros.estado;
        return true;
      });
    }

    // Búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter(item => {
        if (tipo === 'personal') {
          return item.nombre?.toLowerCase().includes(busqueda) ||
                 item.email?.toLowerCase().includes(busqueda) ||
                 item.placa?.toLowerCase().includes(busqueda);
        }
        if (tipo === 'unidades') {
          return item.codigo?.toLowerCase().includes(busqueda);
        }
        return true;
      });
    }

    setDatosFiltrados(filtrados);
  };

  const exportarExcel = () => {
    try {
      reportesService.generarExcelPersonalizado(datosFiltrados, tipo, filtros, user);
      toast.success('Reporte Excel generado');
    } catch (error) {
      toast.error('Error generando Excel');
    }
  };

  const exportarPDF = () => {
    try {
      reportesService.generarPDFPersonalizado(datosFiltrados, tipo, filtros, user);
      toast.success('Reporte PDF generado');
    } catch (error) {
      toast.error('Error generando PDF');
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando datos para el reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/reportes')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{info.titulo}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {datosFiltrados.length} registros encontrados
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setVistaPrevia(!vistaPrevia)}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Eye size={18} className="text-gray-500" />
            {vistaPrevia ? 'Ocultar vista' : 'Ver vista previa'}
          </button>
          <button
            onClick={exportarExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button
            onClick={exportarPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FilePieChart size={18} />
            PDF Profesional
          </button>
          <button
            onClick={cargarDatos}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-400" />
          <h2 className="text-sm font-medium text-gray-700">Filtros del reporte</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {info.filtrosDisponibles[0]?.opciones.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {info.filtrosDisponibles[1]?.opciones.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Búsqueda</label>
          <input
            type="text"
            placeholder={`Buscar por ${tipo === 'personal' ? 'nombre, email o placa' : 'código'}`}
            value={filtros.busqueda}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vista previa de datos */}
      {vistaPrevia && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Vista previa de datos
            </h2>
            <span className="text-xs text-gray-400">
              Mostrando {Math.min(10, datosFiltrados.length)} de {datosFiltrados.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {info.campos.map(campo => (
                    <th key={campo.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      {campo.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {datosFiltrados.slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {info.campos.map(campo => (
                      <td key={campo.key} className="px-4 py-3 text-sm text-gray-600">
                        {typeof item[campo.key] === 'object' 
                          ? (item[campo.key]?.length || 0) 
                          : (item[campo.key]?.toString() || '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen del reporte */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <info.icono size={24} className={`text-${info.color}-600`} />
            <div>
              <p className="text-sm font-medium text-gray-700">Resumen del reporte</p>
              <p className="text-xs text-gray-500">
                Se incluirán {datosFiltrados.length} registros en el reporte final
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportarExcel}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Exportar Excel
            </button>
            <button
              onClick={exportarPDF}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneradorReporte;