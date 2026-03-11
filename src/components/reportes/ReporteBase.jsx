import { useState } from 'react';
import { FileSpreadsheet, FilePieChart, X, User, Calendar, Filter } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const ReporteBase = ({ 
  titulo, 
  datos, 
  columnas, 
  tipo, 
  filtrosPersonalizados = null,
  onClose 
}) => {
  const { user } = useAuthStore();
  const [filtros, setFiltros] = useState({});

  // =====================================================
  // GENERAR EXCEL
  // =====================================================
  const generarExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Preparar datos para Excel
      const excelData = datos.map(item => {
        const fila = {};
        columnas.forEach(col => {
          if (col.key) {
            fila[col.label] = item[col.key] || '-';
          }
        });
        return fila;
      });
      
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, tipo);
      
      // Guardar archivo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Reporte Excel generado');
    } catch (error) {
      toast.error('Error generando Excel');
    }
  };

  // =====================================================
  // GENERAR PDF PROFESIONAL
  // =====================================================
  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleString('es-MX');
      
      // =====================================================
      // ENCABEZADO PROFESIONAL
      // =====================================================
      // Logo o título principal
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 220, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Sistema de Emergencias', 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporte Oficial', 14, 30);
      
      // =====================================================
      // INFORMACIÓN DEL REPORTE
      // =====================================================
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Reporte:', 14, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Título: ${titulo}`, 14, 58);
      doc.text(`Tipo: ${tipo}`, 14, 66);
      doc.text(`Fecha de emisión: ${fecha}`, 14, 74);
      
      // =====================================================
      // INFORMACIÓN DEL USUARIO
      // =====================================================
      doc.setFont('helvetica', 'bold');
      doc.text('Emitido por:', 120, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Usuario: ${user?.nombre || 'N/A'}`, 120, 58);
      doc.text(`Rol: ${user?.rol || 'N/A'}`, 120, 66);
      doc.text(`Email: ${user?.email || 'N/A'}`, 120, 74);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 85, 196, 85);
      
      // =====================================================
      // TABLA DE DATOS
      // =====================================================
      const tableColumn = columnas.map(col => col.label);
      const tableRows = datos.map(item => 
        columnas.map(col => item[col.key] || '-')
      );
      
      autoTable(doc, {
        startY: 95,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 },
        columnStyles: columnas.reduce((acc, col, index) => {
          if (col.width) acc[index] = { cellWidth: col.width };
          return acc;
        }, {})
      });
      
      // =====================================================
      // PIE DE PÁGINA
      // =====================================================
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${totalPaginas} - Generado por ${user?.nombre || 'Sistema'}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
      
      // Guardar PDF
      doc.save(`${tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Reporte PDF generado');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error generando PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{titulo}</h2>
            <p className="text-blue-100 text-sm mt-1">Generando reporte de {tipo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {/* Filtros personalizados (si existen) */}
          {filtrosPersonalizados && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Filtros del reporte</h3>
              </div>
              {filtrosPersonalizados(filtros, setFiltros)}
            </div>
          )}

          {/* Vista previa de datos */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              Vista previa ({datos.length} registros)
            </h3>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {columnas.map((col, idx) => (
                      <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {datos.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      {columnas.map((col, cidx) => (
                        <td key={cidx} className="px-4 py-2 text-sm text-gray-600">
                          {item[col.key] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {datos.length > 5 && (
                <div className="px-4 py-2 text-xs text-gray-400 border-t">
                  ... y {datos.length - 5} registros más
                </div>
              )}
            </div>
          </div>

          {/* Información del emisor */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Información del emisor</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-600">Nombre</p>
                <p className="text-sm font-medium text-blue-900">{user?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Rol</p>
                <p className="text-sm font-medium text-blue-900 capitalize">{user?.rol}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600">Email</p>
                <p className="text-sm font-medium text-blue-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={generarExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button
            onClick={generarPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FilePieChart size={18} />
            PDF Profesional
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReporteBase;