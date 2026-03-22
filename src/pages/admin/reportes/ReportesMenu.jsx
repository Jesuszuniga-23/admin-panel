import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, Truck, Bell, ChevronLeft,
  BarChart3, PieChart, Calendar, Download, FileSpreadsheet, FilePieChart
} from 'lucide-react';
import IconoEntidad from '../../../components/ui/IconoEntidad';

const ReportesMenu = () => {
  const navigate = useNavigate();

  const opcionesReporte = [
    {
      id: 'personal',
      titulo: 'Personal',
      descripcion: 'Personal operativo y administrativo',
      icono: Users,
      entidad: 'ADMIN',
      color: 'blue',
      gradient: 'from-blue-600 to-indigo-700',
      stats: ['Total', 'Activos/Inactivos', 'Disponibilidad'],
    },
    {
      id: 'unidades',
      titulo: 'Unidades',
      descripcion: 'Estado y asignación de unidades',
      icono: Truck,
      entidad: 'PATRULLA',
      color: 'purple',
      gradient: 'from-purple-600 to-indigo-700',
      stats: ['Activas', 'Disponibles/Ocupadas', 'Personal asignado'],
    },
    {
      id: 'alertas',
      titulo: 'Alertas',
      descripcion: 'Alertas expiradas y cerradas manualmente',
      icono: Bell,
      entidad: 'ALERTA_PANICO',
      color: 'amber',
      gradient: 'from-amber-600 to-orange-700',
      stats: ['Por mes', 'Tiempo respuesta', 'Motivos cierre'],
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 hover:bg-white rounded-xl transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Centro de Reportes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Selecciona el tipo de reporte que deseas generar
          </p>
        </div>
      </div>

      {/* Grid de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {opcionesReporte.map((opcion) => {
          return (
            <div
              key={opcion.id}
              onClick={() => navigate(`/admin/reportes/${opcion.id}`)}
              className={`bg-gradient-to-br ${opcion.gradient} rounded-2xl p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl transform duration-300`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <IconoEntidad entidad={opcion.entidad} size={28} color="text-white" />
                </div>
                <div className="flex gap-1">
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full flex items-center gap-1">
                    <FileSpreadsheet size={10} />
                    Excel
                  </span>
                  <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full flex items-center gap-1">
                    <FilePieChart size={10} />
                    PDF
                  </span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{opcion.titulo}</h2>
              <p className="text-xs text-white/80 mb-4">{opcion.descripcion}</p>

              <div className="space-y-1.5 mb-5">
                {opcion.stats.map((stat, idx) => (
                  <div key={idx} className="text-xs text-white/70 flex items-center gap-2">
                    <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                    {stat}
                  </div>
                ))}
              </div>

              <button className="w-full bg-white/20 backdrop-blur-sm text-white text-sm py-2.5 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2 font-medium">
                <Download size={14} />
                Generar Reporte
              </button>
            </div>
          );
        })}
      </div>

      {/* Info adicional */}
      <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <PieChart size={18} className="text-blue-600" />
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-800">Formatos disponibles:</span> 
            <span className="ml-2">Excel (editable) y PDF (profesional)</span>
            <br />
            <span className="text-gray-500">Los reportes incluyen filtros por fecha, tipo y estado. Puedes exportar con vista previa.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesMenu;