// src/components/reports/ReporteBase.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { FileSpreadsheet, FilePieChart, X, User, Calendar, Filter, Loader } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const MAX_REGISTROS_PDF = 500; // Límite para evitar problemas de rendimiento

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
  const [exportando, setExportando] = useState(false);

  // ✅ Memoizar datos procesados
  const datosProcesados = useMemo(() => {
    if (!datos || datos.length === 0) return [];
    
    return datos.map(item => {
      const fila = {};
      columnas.forEach(col => {
        if (col.key) {
          fila[col.label] = item[col.key] !== undefined && item[col.key] !== null 
            ? String(item[col.key]) 
            : '-';
        }
      });
      return fila;
    });
  }, [datos, columnas]);

  // ✅ Verificar si hay datos
  const hayDatos = datos && datos.length > 0;

  // ✅ Generar Excel con límite de registros
  const generarExcel = useCallback(async () => {
    if (!hayDatos) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    setExportando(true);
    const toastId = toast.loading('Generando Excel...');
    
    try {
      // Procesar en chunks si hay muchos datos
      const MAX_REGISTROS_EXCEL = 10000;
      const datosParaExportar = datosProcesados.slice(0, MAX_REGISTROS_EXCEL);
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosParaExportar);
      
      // Ajustar ancho de columnas
      const colWidths = columnas.map(col => ({ wch: Math.max(col.label.length, 15) }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, tipo);
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      const fecha = new Date().toISOString().split('T')[0];
      saveAs(blob, `${tipo}_${fecha}.xlsx`);
      
      toast.success(`Reporte Excel generado (${datosParaExportar.length} registros)`, {
        id: toastId
      });
      
      if (datos.length > MAX_REGISTROS_EXCEL) {
        toast.warning(`Solo se exportaron los primeros ${MAX_REGISTROS_EXCEL} registros`);
      }
    } catch (error) {
      console.error('Error generando Excel:', error);
      toast.error('Error generando Excel', { id: toastId });
    } finally {
      setExportando(false);
    }
  }, [datosProcesados, columnas, tipo, hayDatos]);

  // ✅ Generar PDF con límite de registros
  const generarPDF = useCallback(async () => {
    if (!hayDatos) {
      toast.error('No hay datos para exportar');
      return;
    }
    
    setExportando(true);
    const toastId = toast.loading('Generando PDF...');
    
    try {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleString('es-MX');
      
      // Limitar registros para PDF
      const datosParaPDF = datos.slice(0, MAX_REGISTROS_PDF);
      
      // =====================================================
      // ENCABEZADO PROFESIONAL
      // =====================================================
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
      doc.text(`Total registros: ${datos.length}`, 14, 82);
      
      if (datos.length > MAX_REGISTROS_PDF) {
        doc.setTextColor(255, 100, 0);
        doc.text(`* Mostrando primeros ${MAX_REGISTROS_PDF} registros`, 14, 90);
        doc.setTextColor(0, 0, 0);
      }
      
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
      doc.line(14, 95, 196, 95);
      
      // =====================================================
      // TABLA DE DATOS
      // =====================================================
      const tableColumn = columnas.map(col => col.label);
      const tableRows = datosParaPDF.map(item => 
        columnas.map(col => {
          let valor = item[col.key];
          if (valor === undefined || valor === null) return '-';
          if (typeof valor === 'object') return JSON.stringify(valor).substring(0, 50);
          return String(valor);
        })
      );
      
      autoTable(doc, {
        startY: 105,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 7, cellPadding: 2 },
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
          `Página ${i} de ${totalPaginas} - Generado por ${user?.nombre || 'Sistema'} - ${fecha}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
      
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`${tipo}_${fechaArchivo}.pdf`);
      
      toast.success(`Reporte PDF generado (${datosParaPDF.length} registros)`, {
        id: toastId
      });
      
      if (datos.length > MAX_REGISTROS_PDF) {
        toast.warning(`Solo se incluyeron los primeros ${MAX_REGISTROS_PDF} registros en el PDF`);
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error generando PDF', { id: toastId });
    } finally {
      setExportando(false);
    }
  }, [datos, columnas, titulo, tipo, user, hayDatos]);

  // ✅ Limpiar al desmontar
  useEffect(() => {
    return () => {
      setExportando(false);
    };
  }, []);

  // ✅ Vista previa de datos
  const vistaPrevia = useMemo(() => {
    if (!datos || datos.length === 0) return [];
    return datos.slice(0, 5);
  }, [datos]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{titulo}</h2>
            <p className="text-blue-100 text-sm mt-1">
              Generando reporte de {tipo}
              {datos && datos.length > 0 && ` (${datos.length} registros)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {/* Mensaje cuando no hay datos */}
          {!hayDatos ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No hay datos disponibles</h3>
              <p className="text-sm text-gray-500">
                No se encontraron registros para generar el reporte.
              </p>
            </div>
          ) : (
            <>
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
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
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
                        {vistaPrevia.map((item, idx) => (
                          <tr key={idx}>
                            {columnas.map((col, cidx) => (
                              <td key={cidx} className="px-4 py-2 text-sm text-gray-600">
                                {item[col.key] !== undefined && item[col.key] !== null 
                                  ? String(item[col.key]) 
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                    <p className="text-sm font-medium text-blue-900">{user?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Rol</p>
                    <p className="text-sm font-medium text-blue-900 capitalize">{user?.rol || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-blue-600">Email</p>
                    <p className="text-sm font-medium text-blue-900">{user?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={exportando}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Cancelar"
          >
            Cancelar
          </button>
          <button
            onClick={generarExcel}
            disabled={exportando || !hayDatos}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Exportar a Excel"
          >
            {exportando ? <Loader size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            Excel
          </button>
          <button
            onClick={generarPDF}
            disabled={exportando || !hayDatos}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Exportar a PDF"
          >
            {exportando ? <Loader size={18} className="animate-spin" /> : <FilePieChart size={18} />}
            PDF Profesional
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReporteBase;