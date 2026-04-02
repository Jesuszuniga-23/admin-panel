// src/services/admin/reportesGraficas.service.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Funciones auxiliares
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
    { de: '‚', para: 'é' }, { de: '¢', para: 'ó' }
  ];
  
  let textoCorregido = texto;
  correcciones.forEach(({ de, para }) => {
    textoCorregido = textoCorregido.split(de).join(para);
  });
  
  return textoCorregido;
};

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

const obtenerTextoFiltros = (filtros) => {
  const filtrosAplicados = [];
  
  const formatearFechaLocal = (fechaStr) => {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };
  
  if (filtros.fechaInicio && filtros.fechaFin) {
    const desde = formatearFechaLocal(filtros.fechaInicio);
    const hasta = formatearFechaLocal(filtros.fechaFin);
    filtrosAplicados.push(`Período: ${desde} - ${hasta}`);
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
  
  return filtrosAplicados;
};

// ✅ Función para validar imagen
const esImagenValida = (imgData) => {
  return imgData && typeof imgData === 'string' && imgData.startsWith('data:image');
};

// =====================================================
// FUNCIÓN PARA CALCULAR DIMENSIONES ÓPTIMAS
// =====================================================
const calcularDimensionesOptimas = (img, anchoMaximo = 180, altoMaximo = 120) => {
  return new Promise((resolve, reject) => {
    // ✅ Validar que la imagen sea válida
    if (!esImagenValida(img)) {
      console.warn('Imagen no válida, usando dimensiones por defecto');
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
      return;
    }
    
    const image = new Image();
    const timeoutId = setTimeout(() => {
      console.warn('Timeout cargando imagen');
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
    }, 5000);
    
    image.onload = () => {
      clearTimeout(timeoutId);
      const anchoOriginal = image.width;
      const altoOriginal = image.height;
      const proporcion = anchoOriginal / altoOriginal;
      
      let anchoFinal, altoFinal;
      
      // Mapa (ocupa más espacio)
      if (anchoMaximo === 180 && altoMaximo === 120) {
        anchoFinal = anchoMaximo;
        altoFinal = anchoMaximo / proporcion;
        if (altoFinal > altoMaximo) {
          altoFinal = altoMaximo;
          anchoFinal = altoMaximo * proporcion;
        }
      }
      // Gráfica de pastel
      else if (anchoMaximo === 80) {
        anchoFinal = 80;
        altoFinal = 80;
      }
      // Otras gráficas
      else {
        anchoFinal = anchoMaximo;
        altoFinal = anchoMaximo / proporcion;
        if (altoFinal > altoMaximo) {
          altoFinal = altoMaximo;
          anchoFinal = altoMaximo * proporcion;
        }
      }
      
      resolve({ 
        ancho: Math.round(anchoFinal), 
        alto: Math.round(altoFinal) 
      });
    };
    
    image.onerror = () => {
      clearTimeout(timeoutId);
      console.warn('Error cargando imagen');
      resolve({ ancho: anchoMaximo, alto: altoMaximo });
    };
    
    image.src = img;
  });
};

class ReportesGraficasService {
  
  async generarPDFConGraficas(datos, tipo, filtros, usuario, graficas, options = {}) {
    try {
      console.log('Servicio PDF - Datos recibidos:', {
        tieneMapa: !!graficas.mapa && esImagenValida(graficas.mapa),
        tieneBarras: !!graficas.barras && esImagenValida(graficas.barras),
        tienePastel: !!graficas.pastel && esImagenValida(graficas.pastel),
        tieneTendencias: !!graficas.tendencias && esImagenValida(graficas.tendencias),
        tieneEstados: !!graficas.estados && esImagenValida(graficas.estados),
        totalDatos: datos.length
      });
      
      // ✅ Verificar cancelación
      if (options.signal?.aborted) {
        throw new Error('AbortError');
      }
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const COLOR_PRIMARIO = [30, 58, 138];
      const COLOR_SECUNDARIO = [37, 99, 235];
      
      const fecha = formatearFechaLarga(new Date());
      
      // =====================================================
      // PÁGINA 1: INFORMACIÓN GENERAL
      // =====================================================
      
      // Encabezado
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(0, 0, 210, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA DE EMERGENCIAS', 15, 13);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Análisis Geográfico de Incidentes', 15, 18);
      
      // Tarjeta de información
      let yPos = 25;
      
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(200, 210, 230);
      doc.roundedRect(15, yPos, 180, 38, 3, 3, 'FD');
      
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(15, yPos, 3, 38, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL REPORTE', 25, yPos + 7);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Fecha de emisión:', 25, yPos + 15);
      doc.text(fecha, 50, yPos + 15);
      
      doc.text('Total registros:', 25, yPos + 22);
      doc.text(datos.length.toString(), 50, yPos + 22);
      
      doc.text('Generado por:', 110, yPos + 15);
      doc.text(corregirTexto(usuario?.nombre || 'Sistema'), 135, yPos + 15);
      
      doc.text('Email:', 110, yPos + 22);
      doc.text(usuario?.email || '—', 135, yPos + 22);
      
      yPos += 45;
      
      // Filtros aplicados
      const filtrosAplicados = obtenerTextoFiltros(filtros);
      
      if (filtrosAplicados.length > 0) {
        doc.setFillColor(240, 244, 250);
        doc.roundedRect(15, yPos, 180, 15, 2, 2, 'FD');
        
        doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('FILTROS APLICADOS:', 25, yPos + 6);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        let filtroX = 70;
        filtrosAplicados.forEach((filtro) => {
          doc.text(filtro, filtroX, yPos + 6);
          filtroX += 45;
        });
        
        yPos += 20;
      }
      
      // ✅ Verificar cancelación después de cada sección
      if (options.signal?.aborted) throw new Error('AbortError');
      
      // =====================================================
      // PÁGINA 2: MAPA PRINCIPAL
      // =====================================================
      if (graficas.mapa && esImagenValida(graficas.mapa)) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('MAPA DE INCIDENTES', 15, 10);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Ubicaciones visibles: ${graficas.estadisticas?.conUbicacion || 0} puntos`, 15, yPos + 5);
        
        // Calcular dimensiones para el mapa (más grande)
        const dimensiones = await calcularDimensionesOptimas(graficas.mapa, 180, 120);
        doc.addImage(graficas.mapa, 'PNG', 15, yPos + 10, dimensiones.ancho, dimensiones.alto);
        
        // Leyenda del mapa
        yPos += dimensiones.alto + 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Pánico', 15, yPos);
        doc.text('Médica', 60, yPos);
        
        // ✅ Verificar cancelación
        if (options.signal?.aborted) throw new Error('AbortError');
      }
      
      // =====================================================
      // PÁGINA 3: GRÁFICA DE BARRAS Y PASTEL
      // =====================================================
      if (graficas.barras || graficas.pastel) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS VISUAL DE INCIDENTES', 15, 10);
        
        // Gráfica de barras
        if (graficas.barras && esImagenValida(graficas.barras)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Incidentes por Zona', 15, yPos + 5);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.barras, 180, 80);
          doc.addImage(graficas.barras, 'PNG', 15, yPos + 8, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 15;
        } else {
          yPos += 15;
        }
        
        // ✅ Verificar cancelación
        if (options.signal?.aborted) throw new Error('AbortError');
        
        // Gráfica de pastel
        if (graficas.pastel && esImagenValida(graficas.pastel)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Distribución por Tipo', 15, yPos + 5);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.pastel, 80, 80);
          const xPos = (210 - dimensiones.ancho) / 2;
          doc.addImage(graficas.pastel, 'PNG', xPos, yPos + 8, dimensiones.ancho, dimensiones.alto);
        }
      }
      
      // ✅ Verificar cancelación
      if (options.signal?.aborted) throw new Error('AbortError');
      
      // =====================================================
      // PÁGINA 4: TENDENCIAS Y ESTADOS
      // =====================================================
      if (graficas.tendencias || graficas.estados) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS TEMPORAL Y DE ESTADOS', 15, 10);
        
        // Tendencias
        if (graficas.tendencias && esImagenValida(graficas.tendencias)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Tendencias Mensuales', 15, yPos + 5);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.tendencias, 180, 70);
          doc.addImage(graficas.tendencias, 'PNG', 15, yPos + 8, dimensiones.ancho, dimensiones.alto);
          
          yPos += dimensiones.alto + 15;
        } else {
          yPos += 15;
        }
        
        // ✅ Verificar cancelación
        if (options.signal?.aborted) throw new Error('AbortError');
        
        // Distribución por estado
        if (graficas.estados && esImagenValida(graficas.estados)) {
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Distribución por Estado', 15, yPos + 5);
          
          const dimensiones = await calcularDimensionesOptimas(graficas.estados, 180, 70);
          doc.addImage(graficas.estados, 'PNG', 15, yPos + 8, dimensiones.ancho, dimensiones.alto);
        }
      }
      
      // ✅ Verificar cancelación
      if (options.signal?.aborted) throw new Error('AbortError');
      
      // =====================================================
      // PÁGINA 5: TABLA DE DATOS
      // =====================================================
      if (graficas.datosPorZona && graficas.datosPorZona.length > 0) {
        doc.addPage();
        yPos = 20;
        
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, 210, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE DE INCIDENTES POR ZONA', 15, 10);
        
        // ✅ Límite de 50 zonas para evitar tablas enormes
        const zonasParaMostrar = graficas.datosPorZona.slice(0, 50);
        
        const headers = [['Zona', 'Total', 'Pánico', 'Médica', '%', 'Activas', 'Proceso', 'Cerradas']];
        const dataRows = zonasParaMostrar.map(z => [
          z.zona,
          z.total.toString(),
          z.panico.toString(),
          z.medica.toString(),
          z.porcentaje ? `${z.porcentaje}%` : '0%',
          z.activas.toString(),
          z.enProceso.toString(),
          z.cerradas.toString()
        ]);
        
        autoTable(doc, {
          startY: 25,
          head: headers,
          body: dataRows,
          theme: 'grid',
          headStyles: { fillColor: COLOR_PRIMARIO, textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          margin: { left: 15, right: 15 }
        });
        
        if (graficas.datosPorZona.length > 50) {
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          doc.text(`Nota: Solo se muestran las primeras 50 zonas de ${graficas.datosPorZona.length} totales.`, 15, doc.internal.pageSize.height - 15);
        }
      }
      
      // Pie de página en todas las páginas
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount} • ${new Date().toLocaleDateString('es-MX')} • ${usuario?.nombre || 'Sistema'}`,
          15,
          doc.internal.pageSize.height - 10
        );
      }
      
      const fechaArchivo = new Date().toISOString().split('T')[0];
      doc.save(`Analisis_Geografico_${fechaArchivo}.pdf`);
      
      console.log('PDF con gráficas y mapa generado correctamente');
      return true;
    } catch (error) {
      // ✅ Manejar cancelación
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('🛑 Generación de PDF con gráficas cancelada');
        throw error;
      }
      console.error('Error generando PDF con gráficas:', error);
      throw error;
    }
  }
}

export default new ReportesGraficasService();