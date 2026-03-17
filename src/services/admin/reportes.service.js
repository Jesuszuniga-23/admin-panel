import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// =====================================================
// FUNCIÓN PARA CORREGIR CARACTERES ESPECIALES (ACENTOS)
// =====================================================
const corregirTexto = (texto) => {
  if (!texto) return '';
  
  const correcciones = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
    'Ã�': 'Á', 'Ã‰': 'É', 'Ã�': 'Í', 'Ã“': 'Ó', 'Ãš': 'Ú',
    'Ã±': 'ñ', 'Ã‘': 'Ñ', 'Â¿': '¿', 'Â¡': '¡',
    '£': 'ú', '¤': 'ñ', '€': 'é', '‚': 'é', '¢': 'ó',
    'Ram¡rez': 'Ramírez', 'Z£¤iga': 'Zúñiga', 'L¢pez': 'López',
    'Jes£s': 'Jesús', 'Param‚dico': 'Paramédico', 'Oficial': 'Oficial'
  };
  
  let textoCorregido = texto;
  Object.entries(correcciones).forEach(([de, para]) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });
  
  return textoCorregido;
};

// =====================================================
// FUNCIÓN PARA LIMPIAR TEXTO PARA PDF (SOLO PARA PDF)
// =====================================================
const limpiarTextoPDF = (texto) => {
  if (!texto) return '';
  return corregirTexto(texto)
    .replace(/[Ø=ÜËÅÊdç]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// =====================================================
// FUNCIÓN PARA FORMATEAR TELÉFONO
// =====================================================
const formatearTelefono = (telefono) => {
  if (!telefono) return '—';
  const soloNumeros = telefono.replace(/\D/g, '');
  if (soloNumeros.length === 10) {
    return `${soloNumeros.slice(0,3)} ${soloNumeros.slice(3,6)} ${soloNumeros.slice(6)}`;
  }
  return telefono;
};

// =====================================================
// FUNCIÓN PARA FORMATEAR FECHAS
// =====================================================
const formatearFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

class ReportesService {
  
  // =====================================================
  // GENERAR EXCEL PROFESIONAL - VERSIÓN CORREGIDA
  // =====================================================
  generarExcelPersonalizado(datos, tipo, filtros, usuario) {
    try {
      const wb = XLSX.utils.book_new();
      
      // =====================================================
      // HOJA 1: DATOS PRINCIPALES (TODOS LOS REGISTROS)
      // =====================================================
      let datosFormateados = [];
      
      if (tipo === 'personal') {
        datosFormateados = datos.map(item => ({
          'ID': item.id,
          'NOMBRE COMPLETO': corregirTexto(item.nombre),
          'EMAIL': item.email,
          'ROL': item.rol === 'policia' ? 'Policía' : 
                 item.rol === 'ambulancia' ? 'Ambulancia' : 
                 item.rol === 'admin' ? 'Administrador' : 'Super Admin',
          'PLACA': item.placa || '—',
          'TELÉFONO': formatearTelefono(item.telefono),
          'ESTADO': item.activo ? 'ACTIVO' : 'INACTIVO',
          'DISPONIBLE': item.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE',
          'FECHA CREACIÓN': new Date(item.creado_en).toLocaleDateString('es-MX'),
          'CREADO POR': corregirTexto(item.creador?.nombre) || 'Sistema',
          'ACTUALIZADO POR': corregirTexto(item.actualizador?.nombre) || '—'
        }));
      } else if (tipo === 'unidades') {
        datosFormateados = datos.map(item => ({
          'ID': item.id,
          'CÓDIGO': item.codigo,
          'TIPO': item.tipo === 'policia' ? 'Policía' : 'Ambulancia',
          'ESTADO': item.estado === 'disponible' ? 'DISPONIBLE' :
                    item.estado === 'ocupada' ? 'OCUPADA' : 'INACTIVA',
          'ACTIVA': item.activa ? 'SÍ' : 'NO',
          'PERSONAL': item.personal_asignado?.length || 0,
          'UBICACIÓN': item.lat && item.lng ? 
                      `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : 'SIN UBICACIÓN',
          'FECHA CREACIÓN': new Date(item.creado_en).toLocaleDateString('es-MX'),
          'CREADO POR': corregirTexto(item.creador?.nombre) || 'Sistema',
          'ACTUALIZADO POR': corregirTexto(item.actualizador?.nombre) || '—'
        }));
      }
      
      const wsDatos = XLSX.utils.json_to_sheet(datosFormateados);
      
      // CONFIGURAR ANCHO DE COLUMNAS
      if (tipo === 'personal') {
        wsDatos['!cols'] = [
          { wch: 8 },   // ID
          { wch: 35 },  // NOMBRE
          { wch: 40 },  // EMAIL
          { wch: 18 },  // ROL
          { wch: 12 },  // PLACA
          { wch: 15 },  // TELÉFONO
          { wch: 10 },  // ESTADO
          { wch: 15 },  // DISPONIBLE
          { wch: 15 },  // FECHA CREACIÓN
          { wch: 25 },  // CREADO POR
          { wch: 25 }   // ACTUALIZADO POR
        ];
      } else if (tipo === 'unidades') {
        wsDatos['!cols'] = [
          { wch: 8 },   // ID
          { wch: 15 },  // CÓDIGO
          { wch: 12 },  // TIPO
          { wch: 12 },  // ESTADO
          { wch: 8 },   // ACTIVA
          { wch: 10 },  // PERSONAL
          { wch: 30 },  // UBICACIÓN
          { wch: 15 },  // FECHA CREACIÓN
          { wch: 25 },  // CREADO POR
          { wch: 25 }   // ACTUALIZADO POR
        ];
      }
      
      // ESTILOS PARA ENCABEZADOS (fila 0)
      const rangoDatos = XLSX.utils.decode_range(wsDatos['!ref']);
      
      for (let C = rangoDatos.s.c; C <= rangoDatos.e.c; C++) {
        const celdaRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!wsDatos[celdaRef]) continue;
        
        wsDatos[celdaRef].s = {
          font: { 
            bold: true, 
            color: { rgb: "FFFFFF" }, 
            sz: 12,
            name: 'Arial'
          },
          fill: { 
            fgColor: { rgb: "1E3A8A" } // Azul oscuro
          },
          alignment: { 
            horizontal: 'center', 
            vertical: 'center' 
          },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
      
      // ESTILOS PARA FILAS DE DATOS
      for (let R = 1; R <= rangoDatos.e.r; R++) {
        // Color de fondo alternado
        const colorFondo = R % 2 === 0 ? "F8FAFC" : "FFFFFF";
        
        for (let C = rangoDatos.s.c; C <= rangoDatos.e.c; C++) {
          const celdaRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsDatos[celdaRef]) continue;
          
          const valor = wsDatos[celdaRef].v;
          let colorTexto = "000000";
          let negrita = false;
          
          // COLORES CONDICIONALES
          if (typeof valor === 'string') {
            if (valor.includes('ACTIVO') || valor.includes('DISPONIBLE') || valor === 'SÍ') {
              colorTexto = "059669"; // Verde
              negrita = true;
            } else if (valor.includes('OCUPADO') || valor.includes('OCUPADA') || valor.includes('NO DISPONIBLE')) {
              colorTexto = "DC2626"; // Rojo
              negrita = true;
            } else if (valor.includes('INACTIVO') || valor.includes('NO') && !valor.includes('DISPONIBLE')) {
              colorTexto = "6B7280"; // Gris
            }
          }
          
          wsDatos[celdaRef].s = {
            font: { 
              color: { rgb: colorTexto },
              bold: negrita,
              sz: 11,
              name: 'Arial'
            },
            fill: { 
              fgColor: { rgb: colorFondo }
            },
            alignment: { 
              horizontal: C === 0 ? 'center' : 'left',
              vertical: 'center'
            },
            border: {
              top: { style: 'thin', color: { rgb: "E5E7EB" } },
              bottom: { style: 'thin', color: { rgb: "E5E7EB" } },
              left: { style: 'thin', color: { rgb: "E5E7EB" } },
              right: { style: 'thin', color: { rgb: "E5E7EB" } }
            }
          };
        }
      }
      
      XLSX.utils.book_append_sheet(wb, wsDatos, 'DATOS');
      
      // =====================================================
      // HOJA 2: INFORMACIÓN DEL REPORTE
      // =====================================================
      const infoData = [
        ['INFORMACIÓN DEL REPORTE'],
        [],
        ['FECHA DE GENERACIÓN:', new Date().toLocaleString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })],
        ['TIPO DE REPORTE:', tipo.charAt(0).toUpperCase() + tipo.slice(1)],
        ['TOTAL DE REGISTROS:', datos.length],
        [],
        ['GENERADO POR:'],
        [`USUARIO: ${usuario?.nombre || 'Sistema'}`],
        [`EMAIL: ${usuario?.email || '—'}`],
        [`ROL: ${usuario?.rol || '—'}`],
        [],
        ['FILTROS APLICADOS:']
      ];
      
      if (filtros.fechaInicio) infoData.push([`DESDE: ${new Date(filtros.fechaInicio).toLocaleDateString('es-MX')}`]);
      if (filtros.fechaFin) infoData.push([`HASTA: ${new Date(filtros.fechaFin).toLocaleDateString('es-MX')}`]);
      if (filtros.tipo && filtros.tipo !== 'todos') infoData.push([`TIPO FILTRADO: ${filtros.tipo}`]);
      if (filtros.estado && filtros.estado !== 'todos') infoData.push([`ESTADO FILTRADO: ${filtros.estado}`]);
      if (filtros.busqueda) infoData.push([`BÚSQUEDA: ${filtros.busqueda}`]);
      
      if (infoData.length <= 12) {
        infoData.push(['SIN FILTROS APLICADOS - TODOS LOS REGISTROS']);
      }
      
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      wsInfo['!cols'] = [{ wch: 30 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(wb, wsInfo, 'INFORMACIÓN');
      
      // =====================================================
      // HOJA 3: ESTADÍSTICAS
      // =====================================================
      let statsData = [
        ['ESTADÍSTICAS DEL REPORTE'],
        []
      ];
      
      if (tipo === 'personal') {
        const activos = datos.filter(d => d.activo).length;
        const inactivos = datos.filter(d => !d.activo).length;
        const disponibles = datos.filter(d => d.disponible).length;
        const noDisponibles = datos.filter(d => !d.disponible && d.activo).length;
        
        statsData.push(
          ['RESUMEN GENERAL'],
          ['Total de personal:', datos.length],
          ['Personal activo:', activos, `${Math.round(activos/datos.length*100)}%`],
          ['Personal inactivo:', inactivos, `${Math.round(inactivos/datos.length*100)}%`],
          ['Personal disponible:', disponibles, `${Math.round(disponibles/activos*100 || 0)}% de activos`],
          ['Personal no disponible:', noDisponibles, `${Math.round(noDisponibles/activos*100 || 0)}% de activos`],
          [],
          ['DISTRIBUCIÓN POR ROL'],
          ['Rol', 'Cantidad', 'Porcentaje']
        );
        
        const roles = {
          'Policía': datos.filter(d => d.rol === 'policia').length,
          'Ambulancia': datos.filter(d => d.rol === 'ambulancia').length,
          'Administrador': datos.filter(d => d.rol === 'admin').length,
          'Super Admin': datos.filter(d => d.rol === 'superadmin').length
        };
        
        Object.entries(roles).forEach(([rol, count]) => {
          if (count > 0) {
            statsData.push([rol, count, `${Math.round(count/datos.length*100)}%`]);
          }
        });
      }
      
      const wsStats = XLSX.utils.aoa_to_sheet(statsData);
      wsStats['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 12 }];
      
      XLSX.utils.book_append_sheet(wb, wsStats, 'ESTADÍSTICAS');
      
      // =====================================================
      // GUARDAR ARCHIVO
      // =====================================================
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `Reporte_${tipo.charAt(0).toUpperCase() + tipo.slice(1)}_${fecha}.xlsx`;
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, nombreArchivo);
      
      return true;
    } catch (error) {
      console.error('Error generando Excel:', error);
      throw error;
    }
  }

  // =====================================================
// GENERAR PDF CORPORATIVO - VERSIÓN DEFINITIVA
// =====================================================
generarPDFPersonalizado(datos, tipo, filtros, usuario) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setFont('helvetica', 'normal');
    
    const fecha = new Date().toLocaleString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(' de ', ' de '); // Asegurar formato correcto
    
    // =====================================================
    // ENCABEZADO CORPORATIVO
    // =====================================================
    doc.setFillColor(10, 35, 80);
    doc.rect(0, 0, 297, 22, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEMA DE EMERGENCIAS', 15, 14);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 15, 20);
    
    // =====================================================
    // TARJETA DE INFORMACIÓN - CORREGIDA
    // =====================================================
    let yPos = 35;
    
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 210, 230);
    doc.roundedRect(15, yPos, 267, 45, 3, 3, 'FD');
    
    doc.setFillColor(30, 70, 150);
    doc.rect(15, yPos, 3, 45, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL REPORTE', 25, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Columna izquierda
    doc.text('Fecha de emisión:', 25, yPos + 18);
    doc.text(fecha, 60, yPos + 18);
    
    doc.text('Total registros:', 25, yPos + 26);
    doc.text(datos.length.toString(), 60, yPos + 26);
    
    // Columna derecha
    doc.text('Generado por:', 140, yPos + 18);
    doc.text(limpiarTextoPDF(usuario?.nombre || 'Sistema'), 185, yPos + 18);
    
    doc.text('Email:', 140, yPos + 26);
    doc.text(limpiarTextoPDF(usuario?.email || '—'), 185, yPos + 26);
    
    yPos += 55;
    
    // =====================================================
    // FILTROS - CORREGIDO (con espaciado perfecto)
    // =====================================================
    const filtrosActivos = [];
    if (filtros.fechaInicio) filtrosActivos.push(`Desde: ${new Date(filtros.fechaInicio).toLocaleDateString('es-MX')}`);
    if (filtros.fechaFin) filtrosActivos.push(`Hasta: ${new Date(filtros.fechaFin).toLocaleDateString('es-MX')}`);
    if (filtros.tipo && filtros.tipo !== 'todos') filtrosActivos.push(`Tipo: ${filtros.tipo}`);
    if (filtros.estado && filtros.estado !== 'todos') filtrosActivos.push(`Estado: ${filtros.estado}`);
    if (filtros.busqueda) filtrosActivos.push(`Búsqueda: ${filtros.busqueda}`);
    
    // Calcular altura según cantidad de filtros
    const lineasFiltros = Math.ceil(filtrosActivos.length / 3);
    const alturaFiltros = filtrosActivos.length > 0 ? 18 + (lineasFiltros * 5) : 15;
    
    doc.setFillColor(240, 244, 250);
    doc.roundedRect(15, yPos, 267, alturaFiltros, 2, 2, 'FD');
    
    doc.setTextColor(30, 70, 150);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    if (filtrosActivos.length > 0) {
      doc.text('FILTROS APLICADOS:', 25, yPos + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      // Distribuir filtros en 3 columnas
      let filtroY = yPos + 8;
      let columna = 0;
      
      filtrosActivos.forEach((filtro, index) => {
        const colX = [70, 140, 210][columna];
        doc.text(limpiarTextoPDF(filtro), colX, filtroY);
        
        columna++;
        if (columna === 3) {
          columna = 0;
          filtroY += 6;
        }
      });
      
      yPos += alturaFiltros + 8;
    } else {
      doc.text('SIN FILTROS APLICADOS', 25, yPos + 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('(Mostrando todos los registros disponibles)', 85, yPos + 8);
      
      yPos += alturaFiltros + 8;
    }
    
    // =====================================================
    // TABLA DE DATOS - A LO ANCHO COMPLETO
    // =====================================================
    let headers, dataRows;
    
    if (tipo === 'personal') {
      headers = [[
        { content: 'ID', styles: { halign: 'center' } },
        { content: 'NOMBRE COMPLETO', styles: { halign: 'left' } },
        { content: 'EMAIL', styles: { halign: 'left' } },
        { content: 'ROL', styles: { halign: 'left' } },
        { content: 'PLACA', styles: { halign: 'center' } },
        { content: 'TELÉFONO', styles: { halign: 'center' } },
        { content: 'ESTADO', styles: { halign: 'center' } },
        { content: 'DISPONIBLE', styles: { halign: 'center' } }
      ]];
      
      dataRows = datos.slice(0, 50).map(item => [
        { content: item.id.toString(), styles: { halign: 'center' } },
        { content: limpiarTextoPDF(item.nombre), styles: { halign: 'left' } },
        { content: limpiarTextoPDF(item.email), styles: { halign: 'left' } },
        { 
          content: item.rol === 'policia' ? 'Policía' : 
                   item.rol === 'ambulancia' ? 'Ambulancia' : 
                   item.rol === 'admin' ? 'Admin' : 'Superadmin',
          styles: { halign: 'left' }
        },
        { content: item.placa || '—', styles: { halign: 'center' } },
        { content: item.telefono || '—', styles: { halign: 'center' } },
        { 
          content: item.activo ? 'ACTIVO' : 'INACTIVO',
          styles: { 
            halign: 'center',
            textColor: item.activo ? [5, 150, 105] : [100, 100, 100],
            fontStyle: item.activo ? 'bold' : 'normal'
          }
        },
        { 
          content: item.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE',
          styles: { 
            halign: 'center',
            textColor: item.disponible ? [5, 150, 105] : [220, 38, 38],
            fontStyle: 'bold'
          }
        }
      ]);
    } else if (tipo === 'unidades') {
      headers = [[
        { content: 'ID', styles: { halign: 'center' } },
        { content: 'CÓDIGO', styles: { halign: 'left' } },
        { content: 'TIPO', styles: { halign: 'left' } },
        { content: 'ESTADO', styles: { halign: 'center' } },
        { content: 'ACTIVA', styles: { halign: 'center' } },
        { content: 'PERSONAL', styles: { halign: 'center' } },
        { content: 'UBICACIÓN', styles: { halign: 'left' } }
      ]];
      
      dataRows = datos.slice(0, 50).map(item => [
        { content: item.id.toString(), styles: { halign: 'center' } },
        { content: limpiarTextoPDF(item.codigo), styles: { halign: 'left' } },
        { 
          content: item.tipo === 'policia' ? 'Policía' : 'Ambulancia',
          styles: { halign: 'left' }
        },
        { 
          content: item.estado === 'disponible' ? 'DISPONIBLE' :
                   item.estado === 'ocupada' ? 'OCUPADA' : 'INACTIVA',
          styles: { 
            halign: 'center',
            textColor: item.estado === 'disponible' ? [5, 150, 105] :
                      item.estado === 'ocupada' ? [220, 38, 38] : [100, 100, 100],
            fontStyle: 'bold'
          }
        },
        { content: item.activa ? 'SÍ' : 'NO', styles: { halign: 'center' } },
        { content: (item.personal_asignado?.length || 0).toString(), styles: { halign: 'center' } },
        { 
          content: item.lat && item.lng ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : '—',
          styles: { halign: 'left' }
        }
      ]);
    }
    
    // Calcular anchos para ocupar TODO el ancho (267mm)
    const totalAncho = 267;
    let columnWidths;
    
    if (tipo === 'personal') {
      // Distribución proporcional para 8 columnas
      columnWidths = [
        15,  // ID (5.6%)
        45,  // Nombre (16.8%)
        55,  // Email (20.6%)
        30,  // Rol (11.2%)
        20,  // Placa (7.5%)
        25,  // Teléfono (9.4%)
        25,  // Estado (9.4%)
        52   // Disponible (19.5%) - Aumentado para que no se corte
      ];
    } else {
      // Distribución para 7 columnas
      columnWidths = [
        15,  // ID
        40,  // Código
        30,  // Tipo
        30,  // Estado
        20,  // Activa
        25,  // Personal
        107  // Ubicación (ocupa el resto)
      ];
    }
    
    // Ajustar para que sumen exactamente 267
    const sumaActual = columnWidths.reduce((a, b) => a + b, 0);
    if (sumaActual < totalAncho) {
      const diferencia = totalAncho - sumaActual;
      // Agregar la diferencia a la última columna
      columnWidths[columnWidths.length - 1] += diferencia;
    }
    
    autoTable(doc, {
      startY: yPos,
      head: headers,
      body: dataRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 70, 150],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineColor: [20, 50, 100],
        lineWidth: 0.2
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: Object.fromEntries(
        columnWidths.map((width, index) => [index, { cellWidth: width }])
      ),
      margin: { left: 15, right: 15 },
      tableWidth: totalAncho,
      didDrawPage: function(data) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          doc.setDrawColor(200, 200, 200);
          doc.line(15, doc.internal.pageSize.height - 12, 282, doc.internal.pageSize.height - 12);
          
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.setFont('helvetica', 'normal');
          
          const fechaCorta = new Date().toLocaleDateString('es-MX');
          doc.text(
            `Página ${i} de ${pageCount} • ${fechaCorta} • Usuario: ${limpiarTextoPDF(usuario?.nombre || 'Sistema')}`,
            15,
            doc.internal.pageSize.height - 6
          );
          
          doc.setFont('helvetica', 'italic');
          doc.text('CONFIDENCIAL - USO INSTITUCIONAL', 220, doc.internal.pageSize.height - 6);
        }
      }
    });
    
    const fechaArchivo = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Reporte_${tipo}_${fechaArchivo}.pdf`;
    doc.save(nombreArchivo);
    
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
}
}

export default new ReportesService();