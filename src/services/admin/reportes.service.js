import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

class ReportesService {
  
  generarExcelPersonalizado(datos, tipo, filtros, usuario) {
    try {
      const wb = XLSX.utils.book_new();
      
      // Hoja de datos
      const ws = XLSX.utils.json_to_sheet(datos);
      XLSX.utils.book_append_sheet(wb, ws, tipo);
      
      // Hoja de metadatos
      const metadata = [
        ['REPORTE GENERADO'],
        ['Tipo:', tipo],
        ['Fecha:', new Date().toLocaleString()],
        ['Generado por:', usuario?.nombre],
        ['Email:', usuario?.email],
        ['Rol:', usuario?.rol],
        [''],
        ['FILTROS APLICADOS'],
        ['Fecha inicio:', filtros.fechaInicio || 'No aplica'],
        ['Fecha fin:', filtros.fechaFin || 'No aplica'],
        ['Tipo:', filtros.tipo],
        ['Estado:', filtros.estado],
        ['Búsqueda:', filtros.busqueda || 'No aplica'],
        [''],
        ['TOTAL REGISTROS:', datos.length]
      ];
      
      const wsMeta = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, wsMeta, 'Información');
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Error generando Excel:', error);
      throw error;
    }
  }

  generarPDFPersonalizado(datos, tipo, filtros, usuario) {
    try {
      const doc = new jsPDF();
      const fecha = new Date().toLocaleString('es-MX');
      
      // Encabezado corporativo
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 220, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Sistema de Emergencias', 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reporte de ${tipo}`, 14, 32);
      
      // Información del reporte
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalles del Reporte:', 14, 60);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisión: ${fecha}`, 14, 68);
      doc.text(`Total de registros: ${datos.length}`, 14, 76);
      
      // Información del usuario
      doc.setFont('helvetica', 'bold');
      doc.text('Generado por:', 120, 60);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Usuario: ${usuario?.nombre || 'N/A'}`, 120, 68);
      doc.text(`Rol: ${usuario?.rol || 'N/A'}`, 120, 76);
      doc.text(`Email: ${usuario?.email || 'N/A'}`, 120, 84);
      
      // Filtros aplicados
      let yPos = 100;
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros aplicados:', 14, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      if (filtros.fechaInicio) {
        doc.text(`Desde: ${filtros.fechaInicio}`, 14, yPos);
        yPos += 6;
      }
      if (filtros.fechaFin) {
        doc.text(`Hasta: ${filtros.fechaFin}`, 14, yPos);
        yPos += 6;
      }
      if (filtros.tipo !== 'todos') {
        doc.text(`Tipo: ${filtros.tipo}`, 14, yPos);
        yPos += 6;
      }
      if (filtros.estado !== 'todos') {
        doc.text(`Estado: ${filtros.estado}`, 14, yPos);
        yPos += 6;
      }
      
      // Tabla de datos
      const headers = Object.keys(datos[0] || {}).map(key => key.toUpperCase());
      const rows = datos.slice(0, 50).map(item => Object.values(item));
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 8 }
      });
      
      // Pie de página
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${totalPaginas} - Reporte generado por ${usuario?.nombre || 'Sistema'}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }
      
      doc.save(`${tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
      return true;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }
}

export default new ReportesService();