// src/services/admin/reportes.service.js
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

// CORREGIR CARACTERES ESPECIALES (ACENTOS)
const corregirTexto = (texto) => {
  if (!texto) return '';
  if (typeof texto !== 'string') return texto.toString();
  
  const correcciones = [
    { de: 'Ã¡', para: 'á' }, { de: 'Ã©', para: 'é' }, { de: 'Ã­', para: 'í' },
    { de: 'Ã³', para: 'ó' }, { de: 'Ãº', para: 'ú' }, { de: 'Ã±', para: 'ñ' },
    { de: 'Ã�', para: 'Á' }, { de: 'Ã‰', para: 'É' }, { de: 'Ã�', para: 'Í' },
    { de: 'Ã“', para: 'Ó' }, { de: 'Ãš', para: 'Ú' }, { de: 'Ã‘', para: 'Ñ' },
    { de: 'Â¿', para: '¿' }, { de: 'Â¡', para: '¡' },
    { de: '£', para: 'ú' }, { de: '¤', para: 'ñ' }, { de: '€', para: 'é' },
    { de: '‚', para: 'é' }, { de: '¢', para: 'ó' },
    { de: 'Ram¡rez', para: 'Ramírez' }, { de: 'Z£¤iga', para: 'Zúñiga' },
    { de: 'L¢pez', para: 'López' }, { de: 'Jes£s', para: 'Jesús' },
    { de: 'Param‚dico', para: 'Paramédico' }
  ];
  
  let textoCorregido = texto;
  correcciones.forEach(({ de, para }) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });
  
  return textoCorregido;
};

// FORMATEAR FECHA (DD/MM/YYYY)
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  try {
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return '—';
    const dia = f.getDate().toString().padStart(2, '0');
    const mes = (f.getMonth() + 1).toString().padStart(2, '0');
    const año = f.getFullYear();
    return `${dia}/${mes}/${año}`;
  } catch (e) {
    return '—';
  }
};

// FORMATEAR FECHA LARGA
const formatearFechaLarga = (fecha) => {
  if (!fecha) return '—';
  try {
    const f = new Date(fecha);
    if (isNaN(f.getTime())) return '—';
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = dias[f.getDay()];
    const dia = f.getDate();
    const mes = meses[f.getMonth()];
    const año = f.getFullYear();
    const hora = f.getHours().toString().padStart(2, '0');
    const minuto = f.getMinutes().toString().padStart(2, '0');
    
    return `${diaSemana}, ${dia} de ${mes} de ${año} a las ${hora}:${minuto}`;
  } catch (e) {
    return '—';
  }
};

// FORMATEAR TELÉFONO
const formatearTelefono = (telefono) => {
  if (!telefono) return '—';
  const soloNumeros = telefono.replace(/\D/g, '');
  if (soloNumeros.length === 10) {
    return `${soloNumeros.slice(0,3)} ${soloNumeros.slice(3,6)} ${soloNumeros.slice(6)}`;
  }
  return telefono;
};

// CALCULAR ZONA
const calcularZona = (lat, lng) => {
  if (!lat || !lng) return 'No especificada';
  try {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return 'No especificada';
    if (latNum > 19.6) return 'Zona Norte';
    if (latNum > 19.4 && latNum <= 19.6) {
      if (lngNum < -99.2) return 'Zona Poniente';
      if (lngNum > -99.0) return 'Zona Oriente';
      return 'Zona Centro';
    }
    if (latNum <= 19.4) return 'Zona Sur';
    return 'Otra zona';
  } catch (e) {
    return 'No especificada';
  }
};

// OBTENER TEXTO DE FILTROS APLICADOS - CORREGIDO (fechas en formato local)
const obtenerTextoFiltros = (filtros) => {
  const filtrosAplicados = [];
  
  // Formatear fechas en el mismo formato que se ve en pantalla (DD/MM/YYYY)
  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  if (filtros.fechaInicio && filtros.fechaFin) {
    const desde = formatearFechaLocal(filtros.fechaInicio);
    const hasta = formatearFechaLocal(filtros.fechaFin);
    filtrosAplicados.push(`Periodo: ${desde} - ${hasta}`);
  } else if (filtros.fechaInicio) {
    filtrosAplicados.push(`Desde: ${formatearFechaLocal(filtros.fechaInicio)}`);
  } else if (filtros.fechaFin) {
    filtrosAplicados.push(`Hasta: ${formatearFechaLocal(filtros.fechaFin)}`);
  }
  
  if (filtros.tipo && filtros.tipo !== 'todos') {
    filtrosAplicados.push(`Tipo: ${filtros.tipo}`);
  }
  
  if (filtros.estado && filtros.estado !== 'todos') {
    filtrosAplicados.push(`Estado: ${filtros.estado}`);
  }
  
  if (filtros.zona && filtros.zona !== 'todas') {
    filtrosAplicados.push(`Zona: ${filtros.zona}`);
  }
  
  if (filtros.busqueda) {
    filtrosAplicados.push(`Búsqueda: ${filtros.busqueda}`);
  }
  
  return filtrosAplicados;
};

// =====================================================
// CLASE PRINCIPAL DE REPORTES
// =====================================================

class ReportesService {
  
  // =====================================================
  // GENERAR EXCEL PROFESIONAL
  // =====================================================
  async generarExcelPersonalizado(datos, tipo, filtros, usuario) {
    try {
      console.log(`📊 Generando Excel para ${tipo} con ${datos.length} registros`);
      
      if (!datos || datos.length === 0) {
        console.warn('⚠️ No hay datos para exportar');
        return false;
      }
      
      const workbook = new ExcelJS.Workbook();
      const COLOR_PRIMARIO = '1E3A8A';
      const COLOR_SECUNDARIO = '2563EB';
      
      // HOJA 1: DATOS PRINCIPALES
      const datosSheet = workbook.addWorksheet('DATOS');
      
      if (tipo === 'personal') {
        datosSheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'NOMBRE', key: 'nombre', width: 25 },
          { header: 'EMAIL', key: 'email', width: 25 },
          { header: 'ROL', key: 'rol', width: 15 },
          { header: 'PLACA', key: 'placa', width: 12 },
          { header: 'TELÉFONO', key: 'telefono', width: 12 },
          { header: 'ESTADO', key: 'estado', width: 8 },
          { header: 'DISP.', key: 'disponible', width: 8 },
          { header: 'FECHA', key: 'fecha', width: 12 }
        ];
        
        datos.forEach(item => {
          datosSheet.addRow({
            id: item.id,
            nombre: corregirTexto(item.nombre || ''),
            email: item.email || '',
            rol: item.rol === 'policia' ? 'Policía' : 
                 item.rol === 'ambulancia' ? 'Ambulancia' : 
                 item.rol === 'admin' ? 'Admin' : 'Super Admin',
            placa: item.placa || '—',
            telefono: formatearTelefono(item.telefono),
            estado: item.activo ? 'ACTIVO' : 'INACTIVO',
            disponible: item.disponible ? 'SÍ' : 'NO',
            fecha: formatearFecha(item.creado_en)
          });
        });
        
      } else if (tipo === 'unidades') {
        datosSheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'CÓDIGO', key: 'codigo', width: 12 },
          { header: 'TIPO', key: 'tipo', width: 10 },
          { header: 'ESTADO', key: 'estado', width: 12 },
          { header: 'ACTIVA', key: 'activa', width: 8 },
          { header: 'PERSONAL', key: 'personal', width: 8 },
          { header: 'ZONA', key: 'zona', width: 12 },
          { header: 'FECHA', key: 'fecha', width: 12 }
        ];
        
        datos.forEach(item => {
          datosSheet.addRow({
            id: item.id,
            codigo: item.codigo || '',
            tipo: item.tipo === 'policia' ? 'Policía' : 'Ambulancia',
            estado: item.estado === 'disponible' ? 'DISPONIBLE' :
                    item.estado === 'ocupada' ? 'OCUPADA' : 'INACTIVA',
            activa: item.activa ? 'SÍ' : 'NO',
            personal: item.personal_asignado?.length || 0,
            zona: calcularZona(item.lat, item.lng),
            fecha: formatearFecha(item.creado_en)
          });
        });
        
      } else if (tipo === 'alertas') {
        datosSheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'TIPO', key: 'tipo', width: 10 },
          { header: 'ESTADO', key: 'estado', width: 12 },
          { header: 'CIUDADANO', key: 'ciudadano', width: 25 },
          { header: 'UNIDAD', key: 'unidad', width: 12 },
          { header: 'ZONA', key: 'zona', width: 12 },
          { header: 'FECHA', key: 'fecha', width: 12 }
        ];
        
        datos.forEach(item => {
          const nombreCiudadano = item.ciudadano?.nombre || item.ciudadano_nombre || '—';
          const unidadCodigo = item.unidad?.codigo || item.unidad_codigo || '—';
          
          datosSheet.addRow({
            id: item.id,
            tipo: item.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA',
            estado: (item.estado || '').toUpperCase() || '—',
            ciudadano: corregirTexto(nombreCiudadano),
            unidad: unidadCodigo,
            zona: calcularZona(item.lat, item.lng),
            fecha: formatearFecha(item.fecha_creacion)
          });
        });
      }
      
      // ESTILOS PARA ENCABEZADOS
      const headerRow = datosSheet.getRow(1);
      headerRow.height = 20;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11, name: 'Arial' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      
      // ESTILOS PARA DATOS
      datosSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        row.height = 18;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: cell.col === 1 ? 'center' : 'left' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } }
          };
          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });
      
      // HOJA 2: INFORMACIÓN DEL REPORTE
      const infoSheet = workbook.addWorksheet('INFORMACIÓN');
      infoSheet.columns = [{ header: 'CAMPO', key: 'campo', width: 25 }, { header: 'VALOR', key: 'valor', width: 45 }];
      
      infoSheet.addRow({ campo: 'FECHA DE GENERACIÓN', valor: formatearFechaLarga(new Date()) });
      infoSheet.addRow({ campo: 'TIPO DE REPORTE', valor: tipo.charAt(0).toUpperCase() + tipo.slice(1) });
      infoSheet.addRow({ campo: 'TOTAL REGISTROS', valor: datos.length });
      infoSheet.addRow({ campo: 'GENERADO POR', valor: usuario?.nombre || 'Sistema' });
      infoSheet.addRow({ campo: 'EMAIL', valor: usuario?.email || '—' });
      infoSheet.addRow({ campo: 'ROL', valor: usuario?.rol || '—' });
      infoSheet.addRow({ campo: '', valor: '' });
      
      infoSheet.addRow({ campo: '🔍 FILTROS APLICADOS', valor: '' });
      infoSheet.getRow(infoSheet.lastRow.number).eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: COLOR_PRIMARIO } };
      });
      
      const filtrosAplicados = obtenerTextoFiltros(filtros);
      
      if (filtrosAplicados.length > 0) {
        filtrosAplicados.forEach(filtro => {
          const [campo, ...valorParts] = filtro.split(': ');
          const valor = valorParts.join(': ');
          infoSheet.addRow({ campo: campo + ':', valor: valor });
        });
      } else {
        infoSheet.addRow({ campo: 'Sin filtros aplicados:', valor: 'Todos los registros' });
        infoSheet.getRow(infoSheet.lastRow.number).getCell(2).font = { italic: true, color: { argb: '6B7280' } };
      }
      
      const infoHeaderRow = infoSheet.getRow(1);
      infoHeaderRow.height = 22;
      infoHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_SECUNDARIO } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      
      // GUARDAR ARCHIVO
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fecha = new Date().toISOString().split('T')[0];
      saveAs(blob, `Reporte_${tipo}_${fecha}.xlsx`);
      
      console.log(`✅ Excel generado correctamente con ${datos.length} registros`);
      return true;
    } catch (error) {
      console.error('❌ Error generando Excel:', error);
      throw error;
    }
  }

  // =====================================================
  // GENERAR PDF PROFESIONAL (CORREGIDO)
  // =====================================================
  generarPDFPersonalizado(datos, tipo, filtros, usuario) {
    try {
      console.log(`📄 Generando PDF para ${tipo} con ${datos.length} registros`);
      
      if (!datos || datos.length === 0) {
        console.warn('⚠️ No hay datos para exportar');
        return false;
      }
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const COLOR_PRIMARIO = [30, 58, 138];
      const COLOR_SECUNDARIO = [37, 99, 235];
      
      const fecha = formatearFechaLarga(new Date());
      
      // ENCABEZADO
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(0, 0, 297, 22, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA DE EMERGENCIAS', 15, 14);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 15, 20);
      
      // TARJETA DE INFORMACIÓN
      let yPos = 32;
      
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 210, 230);
      doc.roundedRect(15, yPos, 267, 38, 3, 3, 'FD');
      
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(15, yPos, 3, 38, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL REPORTE', 25, yPos + 7);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Fecha de emisión:', 25, yPos + 16);
      doc.text(fecha, 60, yPos + 16);
      
      doc.text('Total registros:', 25, yPos + 23);
      doc.text(datos.length.toString(), 60, yPos + 23);
      
      doc.text('Generado por:', 140, yPos + 16);
      doc.text(corregirTexto(usuario?.nombre || 'Sistema'), 185, yPos + 16);
      
      doc.text('Email:', 140, yPos + 23);
      doc.text(usuario?.email || '—', 185, yPos + 23);
      
      yPos += 45;
      
      // SECCIÓN DE FILTROS APLICADOS - CORREGIDA
      const filtrosAplicados = obtenerTextoFiltros(filtros);
      
      if (filtrosAplicados.length > 0) {
        doc.setFillColor(240, 244, 250);
        doc.roundedRect(15, yPos, 267, 15 + (Math.ceil(filtrosAplicados.length / 3) * 5), 2, 2, 'FD');
        
        doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FILTROS APLICADOS:', 25, yPos + 6);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        let filtroX = 70;
        let filtroY = yPos + 6;
        let columna = 0;
        
        filtrosAplicados.forEach((filtro) => {
          const colX = [70, 140, 210][columna];
          doc.text(filtro, colX, filtroY);
          
          columna++;
          if (columna === 3) {
            columna = 0;
            filtroY += 5;
          }
        });
        
        yPos += 20 + (Math.ceil(filtrosAplicados.length / 3) * 5);
      } else {
        doc.setFillColor(240, 244, 250);
        doc.roundedRect(15, yPos, 267, 12, 2, 2, 'FD');
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Sin filtros aplicados - Mostrando todos los registros', 25, yPos + 7);
        
        yPos += 17;
      }
      
      // TABLA DE DATOS
      let headers, dataRows;
      
      if (tipo === 'personal') {
        headers = [['ID', 'NOMBRE', 'EMAIL', 'ROL', 'PLACA', 'ESTADO']];
        dataRows = datos.slice(0, 100).map(item => [
          item.id,
          corregirTexto(item.nombre || '—'),
          item.email || '—',
          item.rol === 'policia' ? 'Policía' : 
          item.rol === 'ambulancia' ? 'Ambulancia' : 
          item.rol === 'admin' ? 'Admin' : 'Superadmin',
          item.placa || '—',
          item.activo ? 'ACTIVO' : 'INACTIVO'
        ]);
      } else if (tipo === 'unidades') {
        headers = [['ID', 'CÓDIGO', 'TIPO', 'ESTADO', 'ACTIVA', 'ZONA']];
        dataRows = datos.slice(0, 100).map(item => [
          item.id,
          item.codigo || '—',
          item.tipo === 'policia' ? 'Policía' : 'Ambulancia',
          (item.estado || '').toUpperCase() || '—',
          item.activa ? 'SÍ' : 'NO',
          calcularZona(item.lat, item.lng)
        ]);
      } else {
        headers = [['ID', 'TIPO', 'ESTADO', 'CIUDADANO', 'UNIDAD', 'ZONA']];
        dataRows = datos.slice(0, 100).map(item => {
          const nombreCiudadano = item.ciudadano?.nombre || item.ciudadano_nombre || '—';
          const unidadCodigo = item.unidad?.codigo || item.unidad_codigo || '—';
          
          return [
            item.id,
            item.tipo === 'panico' ? 'PÁNICO' : 'MÉDICA',
            (item.estado || '').toUpperCase() || '—',
            corregirTexto(nombreCiudadano),
            unidadCodigo,
            calcularZona(item.lat, item.lng)
          ];
        });
      }
      
      autoTable(doc, {
        startY: yPos,
        head: headers,
        body: dataRows,
        theme: 'grid',
        headStyles: { fillColor: COLOR_PRIMARIO, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 }
      });
      
      // PIE DE PÁGINA
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount} • ${new Date().toLocaleDateString('es-MX')} • ${usuario?.nombre || 'Sistema'}`,
          15,
          doc.internal.pageSize.height - 8
        );
      }
      
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`Reporte_${tipo}_${fechaArchivo}.pdf`);
      
      console.log(`✅ PDF generado correctamente`);
      return true;
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw error;
    }
  }
}

export default new ReportesService();