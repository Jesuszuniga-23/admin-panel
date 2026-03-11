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
      titulo: 'Reporte de Personal',
      descripcion: 'Información completa del personal operativo y administrativo',
      icono: Users,
      color: 'blue',
      stats: ['Total de personal', 'Activos/Inactivos', 'Disponibilidad'],
      ejemplo: 'Nombre, email, rol, placa, estado'
    },
    {
      id: 'unidades',
      titulo: 'Reporte de Unidades',
      descripcion: 'Estado y asignación de unidades operativas',
      icono: Truck,
      color: 'purple',
      stats: ['Unidades activas', 'Disponibles/Ocupadas', 'Personal asignado'],
      ejemplo: 'Código, tipo, estado, ubicación'
    },
    {
      id: 'alertas',
      titulo: 'Reporte de Alertas',
      descripcion: 'Historial de alertas expiradas y cerradas manualmente',
      icono: Bell,
      color: 'amber',
      stats: ['Alertas por mes', 'Tiempo de respuesta', 'Motivos de cierre'],
      ejemplo: 'ID, tipo, ciudadano, estado, motivo'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Centro de Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona el tipo de reporte que deseas generar
          </p>
        </div>
      </div>

      {/* Grid de opciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              className={`${colores[opcion.color]} border-2 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <Icono size={28} className={`text-${opcion.color}-600`} />
                </div>
                <span className="text-xs bg-white px-3 py-1 rounded-full shadow-sm">
                  3 formatos
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">{opcion.titulo}</h2>
              <p className="text-sm text-gray-600 mb-4">{opcion.descripcion}</p>

              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-700">Incluye:</p>
                <ul className="space-y-1">
                  {opcion.stats.map((stat, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      {stat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-gray-400">
                  Ejemplo: {opcion.ejemplo}
                </p>
              </div>

              <button className="mt-4 w-full bg-white text-gray-700 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Download size={16} />
                Generar reporte
              </button>
            </div>
          );
        })}
      </div>

      {/* Info adicional */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <PieChart size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">Reportes personalizados</h3>
            <p className="text-sm text-gray-600">
              Todos los reportes incluyen filtros por fecha y tipo, vista previa de datos,
              y pueden exportarse en formato PDF profesional o Excel para análisis detallado.
            </p>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">PDF con logo y firma</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Excel editable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Vista previa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesMenu;