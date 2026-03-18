import { useNavigate } from 'react-router-dom';
import { 
  FileText, Users, Truck, Bell, ChevronLeft,
  BarChart3, PieChart, Calendar, Download
} from 'lucide-react';

const ReportesMenu = () => {
  const navigate = useNavigate();

  const opcionesReporte = [
    {
      id: 'personal',
      titulo: 'Personal',
      descripcion: 'Personal operativo y administrativo',
      icono: Users,
      color: 'blue',
      stats: ['Total', 'Activos/Inactivos', 'Disponibilidad'],
    },
    {
      id: 'unidades',
      titulo: 'Unidades',
      descripcion: 'Estado y asignación de unidades',
      icono: Truck,
      color: 'purple',
      stats: ['Activas', 'Disponibles/Ocupadas', 'Personal asignado'],
    },
    {
      id: 'alertas',
      titulo: 'Alertas',
      descripcion: 'Alertas expiradas y cerradas manualmente',
      icono: Bell,
      color: 'amber',
      stats: ['Por mes', 'Tiempo respuesta', 'Motivos cierre'],
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Centro de Reportes</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Selecciona el tipo de reporte
          </p>
        </div>
      </div>

      {/* Grid de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {opcionesReporte.map((opcion) => {
          const Icono = opcion.icono;
          const colores = {
            blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
            amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
          };

          return (
            <div
              key={opcion.id}
              onClick={() => navigate(`/admin/reportes/${opcion.id}`)}
              className={`${colores[opcion.color]} border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-white rounded-lg shadow-sm">
                  <Icono size={22} className={`text-${opcion.color}-600`} />
                </div>
                <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm">
                  PDF/Excel
                </span>
              </div>

              <h2 className="text-lg font-semibold text-gray-800 mb-1">{opcion.titulo}</h2>
              <p className="text-xs text-gray-600 mb-3">{opcion.descripcion}</p>

              <div className="space-y-1 mb-3">
                {opcion.stats.map((stat, idx) => (
                  <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    {stat}
                  </div>
                ))}
              </div>

              <button className="w-full bg-white text-gray-700 text-sm py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Download size={14} />
                Generar
              </button>
            </div>
          );
        })}
      </div>

      {/* Info adicional */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-white rounded-lg shrink-0">
            <PieChart size={18} className="text-blue-600" />
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-medium text-gray-800">Formatos:</span> PDF (profesional) y Excel (editable). 
            Incluyen filtros por fecha y tipo.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesMenu;